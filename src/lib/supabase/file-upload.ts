// src/lib/file-upload.ts
// 파일 업로드 서비스 (Supabase Storage 사용)

import { supabase } from './client'
import { OrderFile } from '@/types/order'

export class FileUploadService {
  private static readonly BUCKET_NAME = 'order-files'
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif'
  ]

  /**
   * 파일 유효성 검사
   */
  static validateFile(file: File): { isValid: boolean; error?: string } {
    // 파일 크기 검사
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `파일 크기가 너무 큽니다. 최대 ${this.MAX_FILE_SIZE / 1024 / 1024}MB까지 허용됩니다.`
      }
    }

    // 파일 타입 검사
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: '지원하지 않는 파일 형식입니다. PDF, Word, Excel, 이미지 파일만 업로드 가능합니다.'
      }
    }

    return { isValid: true }
  }

  /**
   * 파일명 정규화 (한글, 특수문자 처리)
   */
  static normalizeFileName(fileName: string, orderId: string): string {
    const timestamp = Date.now()
    const extension = fileName.split('.').pop()
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '')
    
    // 한글과 특수문자를 안전한 문자로 변환
    const safeName = nameWithoutExt
      .replace(/[^a-zA-Z0-9가-힣\-_]/g, '_')
      .substring(0, 50) // 이름 길이 제한
    
    return `${orderId}/${timestamp}_${safeName}.${extension}`
  }

  /**
   * 단일 파일 업로드
   */
  static async uploadFile(
    file: File, 
    orderId: string, 
    fileType: OrderFile['file_type'] = 'other'
  ): Promise<{ success: boolean; data?: OrderFile; error?: string }> {
    try {
      // 파일 유효성 검사
      const validation = this.validateFile(file)
      if (!validation.isValid) {
        return { success: false, error: validation.error }
      }

      // 파일명 정규화
      const normalizedName = this.normalizeFileName(file.name, orderId)

      // Supabase Storage에 업로드
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(normalizedName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('File upload error:', uploadError)
        return { success: false, error: '파일 업로드에 실패했습니다.' }
      }

      // 파일 URL 생성
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(normalizedName)

      // 데이터베이스에 파일 정보 저장
      const fileRecord: Omit<OrderFile, 'id' | 'uploaded_at'> = {
        order_id: orderId,
        file_name: file.name,
        file_type: fileType,
        file_size: file.size,
        file_url: urlData.publicUrl,
        uploaded_by: '시스템' // 나중에 실제 사용자 정보로 교체
      }

      const { data: dbData, error: dbError } = await supabase
        .from('order_files')
        .insert(fileRecord)
        .select()
        .single()

      if (dbError) {
        console.error('Database insert error:', dbError)
        // 스토리지에서 업로드된 파일 삭제
        await supabase.storage
          .from(this.BUCKET_NAME)
          .remove([normalizedName])
        
        return { success: false, error: '파일 정보 저장에 실패했습니다.' }
      }

      return { success: true, data: dbData as OrderFile }

    } catch (error) {
      console.error('Upload service error:', error)
      return { success: false, error: '파일 업로드 중 오류가 발생했습니다.' }
    }
  }

  /**
   * 다중 파일 업로드
   */
  static async uploadMultipleFiles(
    files: File[], 
    orderId: string
  ): Promise<{ 
    success: boolean; 
    results: Array<{ file: File; success: boolean; data?: OrderFile; error?: string }>;
    successCount: number;
    failCount: number;
  }> {
    const results = []
    let successCount = 0
    let failCount = 0

    for (const file of files) {
      const fileType = this.determineFileType(file)
      const result = await this.uploadFile(file, orderId, fileType)
      
      const fileResult = {
        file,
        success: result.success,
        data: result.data,
        error: result.error
      }
      
      results.push(fileResult)
      
      if (result.success) {
        successCount++
      } else {
        failCount++
      }
    }

    return {
      success: failCount === 0,
      results,
      successCount,
      failCount
    }
  }

  /**
   * 파일 타입 자동 결정
   */
  private static determineFileType(file: File): OrderFile['file_type'] {
    const fileName = file.name.toLowerCase()
    
    if (fileName.includes('계약') || fileName.includes('contract')) {
      return 'contract'
    } else if (fileName.includes('도면') || fileName.includes('drawing') || fileName.includes('plan')) {
      return 'drawing'
    } else if (fileName.includes('보고서') || fileName.includes('report')) {
      return 'report'
    } else if (fileName.includes('인증') || fileName.includes('certificate')) {
      return 'certificate'
    } else {
      return 'other'
    }
  }

  /**
   * 수주의 모든 파일 조회
   */
  static async getOrderFiles(orderId: string): Promise<OrderFile[]> {
    const { data, error } = await supabase
      .from('order_files')
      .select('*')
      .eq('order_id', orderId)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Get order files error:', error)
      return []
    }

    return data as OrderFile[]
  }

  /**
   * 파일 삭제
   */
  static async deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 데이터베이스에서 파일 정보 조회
      const { data: fileData, error: selectError } = await supabase
        .from('order_files')
        .select('*')
        .eq('id', fileId)
        .single()

      if (selectError || !fileData) {
        return { success: false, error: '파일 정보를 찾을 수 없습니다.' }
      }

      // 스토리지에서 파일 삭제
      const fileName = fileData.file_url.split('/').pop()
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from(this.BUCKET_NAME)
          .remove([`${fileData.order_id}/${fileName}`])

        if (storageError) {
          console.error('Storage delete error:', storageError)
        }
      }

      // 데이터베이스에서 파일 정보 삭제
      const { error: deleteError } = await supabase
        .from('order_files')
        .delete()
        .eq('id', fileId)

      if (deleteError) {
        console.error('Database delete error:', deleteError)
        return { success: false, error: '파일 정보 삭제에 실패했습니다.' }
      }

      return { success: true }

    } catch (error) {
      console.error('Delete file error:', error)
      return { success: false, error: '파일 삭제 중 오류가 발생했습니다.' }
    }
  }

  /**
   * 파일 다운로드 URL 생성
   */
  static async getDownloadUrl(fileUrl: string): Promise<string> {
    // 이미 public URL이므로 그대로 반환
    return fileUrl
  }

  /**
   * 파일 크기 포맷팅
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 파일 타입별 아이콘 반환
   */
  static getFileIcon(fileType: OrderFile['file_type']): string {
    const icons = {
      contract: '📄',
      drawing: '📐',
      report: '📊',
      certificate: '🏆',
      other: '📎'
    }
    return icons[fileType] || icons.other
  }
}

// Supabase Storage 버킷 초기화 함수
export async function initializeStorageBucket() {
  const { data, error } = await supabase.storage.getBucket('order-files')
  
  if (error && error.message.includes('Bucket not found')) {
    // 버킷이 없으면 생성
    const { error: createError } = await supabase.storage.createBucket('order-files', {
      public: true,
      allowedMimeTypes: FileUploadService['ALLOWED_TYPES'],
      fileSizeLimit: FileUploadService['MAX_FILE_SIZE']
    })
    
    if (createError) {
      console.error('Failed to create storage bucket:', createError)
    }
  }
}