// src/lib/file-upload.ts
// 파일 업로드 서비스 (Supabase Storage 사용)

import { supabase } from './client'
import { OrderFile } from '@/types/order'

export class FileUploadService {
  private static readonly BUCKET_NAME = 'order-attachments'
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
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
   * 파일명 정규화 (한글, 특수문자 처리 강화 및 디버깅 로그 추가)
   */
  static normalizeFileName(fileName: string, orderId: string): string {
    const timestamp = Date.now();
    const extension = fileName.split('.').pop() || 'file';
    let nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    if (fileName.lastIndexOf('.') === -1) { // 확장자가 없는 파일의 경우
        nameWithoutExt = fileName;
    }

    // 1. 모든 공백을 언더스코어로 변경
    let safeName = nameWithoutExt.replace(/\s+/g, '_');
    
    // 2. 허용되지 않는 모든 특수문자를 언더스코어로 변경 (더 넓은 범위)
    // Supabase는 일반적으로 URL에 안전한 문자만 허용 (알파벳, 숫자, -, _, .)
    safeName = safeName.replace(/[^a-zA-Z0-9\-_\.]/g, '_');
    
    // 3. 연속된 언더스코어를 하나로 축약
    safeName = safeName.replace(/__+/g, '_');
    
    // 4. 이름 길이 제한 (확장자 제외)
    safeName = safeName.substring(0, 50);

    // 5. 혹시나 이름이 비거나 언더스코어만 남는 경우 대체 이름 사용
    if (!safeName || safeName.replace(/_/g, '').length === 0) {
        safeName = `file_${timestamp}`;
    }
    
    return `${orderId}/${timestamp}_${safeName}.${extension}`;
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
        
        // Storage Objects 정책 누락 (가장 흔한 오류)
        if (uploadError.message.includes('new row violates row-level security policy') ||
            uploadError.message.includes('insufficient_privilege') ||
            uploadError.message.includes('violates row-level security')) {
          return { 
            success: false, 
            error: '🔒 Storage Objects 정책이 누락되었습니다!\n\n📋 해결방법:\n1. Supabase 대시보드 > SQL Editor\n2. storage-objects-fix.sql 파일 실행\n3. 애플리케이션 새로고침\n\n💡 "Other policies under storage.objects"에 정책이 있어야 합니다.' 
          }
        }
        
        // 일반적인 정책 관련 오류
        if (uploadError.message.includes('policy')) {
          return { 
            success: false, 
            error: '🔒 Storage 정책 설정 오류입니다.\n\n해결방법:\n1. Supabase 대시보드 > Storage > Policies\n2. storage-objects-fix.sql 파일 실행\n3. 또는 관리자에게 문의하세요.' 
          }
        }
        
        // Storage 버킷 관련 오류 처리
        if (uploadError.message.includes('Bucket not found') || 
            uploadError.message.includes('bucket does not exist')) {
          return { 
            success: false, 
            error: '📁 Storage 버킷이 없습니다.\n\n해결방법:\n1. Supabase 대시보드 > Storage\n2. "order-attachments" 버킷 생성\n3. Public 설정 활성화' 
          }
        }
        
        // 권한 관련 오류 처리
        if (uploadError.message.includes('permission') ||
            uploadError.message.includes('unauthorized')) {
          return {
            success: false,
            error: '�� 파일 업로드 권한이 없습니다.\n관리자에게 Storage 권한 설정을 요청해주세요.'
          }
        }
        
        // 파일 크기 제한 오류
        if (uploadError.message.includes('file size') ||
            uploadError.message.includes('too large')) {
          return {
            success: false,
            error: '📏 파일 크기가 너무 큽니다. 10MB 이하의 파일만 업로드 가능합니다.'
          }
        }
        
        // 기타 오류
        return { success: false, error: `❌ 파일 업로드에 실패했습니다: ${uploadError.message}` }
      }

      if (!uploadData?.path) {
        return { success: false, error: '❌ 파일 업로드 경로를 가져올 수 없습니다.' }
      }

      // 파일 URL 생성 - publicUrl 확실하게 생성
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(uploadData.path)

      const publicUrl = urlData.publicUrl
      if (!publicUrl) {
        return { success: false, error: '❌ 파일 URL을 생성할 수 없습니다.' }
      }

      // 데이터베이스에 파일 정보 저장
      const fileRecord = {
        order_id: orderId,
        file_name: file.name,
        file_type: fileType,
        file_size: file.size,
        file_url: publicUrl, // 반드시 유효한 URL
        uploaded_by: '시스템' // 나중에 실제 사용자 정보로 교체
      }

      const { data: dbData, error: dbError } = await supabase
        .from('order_files')
        .insert(fileRecord)
        .select()
        .single()

      if (dbError) {
        console.error('Database insert error:', dbError)
        // 스토리지에서 업로드된 파일 삭제 (롤백)
        try {
          await supabase.storage
            .from(this.BUCKET_NAME)
            .remove([uploadData.path])
        } catch (cleanupError) {
          console.warn('Failed to cleanup uploaded file:', cleanupError)
        }
        
        return { success: false, error: `💾 파일 정보 저장에 실패했습니다: ${dbError.message}` }
      }

      return { success: true, data: dbData as OrderFile }

    } catch (error: any) {
      console.error('Upload service error:', error)
      return { success: false, error: '❌ 파일 업로드 중 예상치 못한 오류가 발생했습니다.' }
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
      console.error('[FileUploadService] Get order files error:', error)
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