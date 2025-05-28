// src/lib/supabase/storage-init.ts
// Supabase Storage 버킷 초기화 유틸리티 (정책 확인 포함)

import { supabase } from './client'

export async function initializeStorageBuckets() {
  try {
    console.log('🔍 Checking storage buckets and policies...')
    
    // 1. Storage 접근 권한 확인
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      // Storage 접근 권한이 없는 경우
      if (listError.message.includes('permission') || 
          listError.message.includes('policy') ||
          listError.message.includes('unauthorized')) {
        console.log('⚠️ Storage access limited - admin setup required')
        console.log('💡 Run supabase-storage-policies.sql to fix this')
        return false
      }
      
      console.warn('⚠️ Storage list error (non-critical):', listError.message)
      return false
    }

    // 2. order-attachments 버킷 존재 확인
    const orderAttachmentsBucket = buckets?.find(bucket => bucket.name === 'order-attachments')
    
    if (!orderAttachmentsBucket) {
      console.log('📁 order-attachments bucket not found, attempting to create...')
      
      // 3. 버킷 생성 시도
      const { error: createError } = await supabase.storage.createBucket('order-attachments', {
        public: true,
        allowedMimeTypes: [
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
        ],
        fileSizeLimit: 10 * 1024 * 1024 // 10MB
      })
      
      if (createError) {
        // 권한 관련 오류는 정상적인 상황으로 처리
        if (createError.message.includes('row-level security') || 
            createError.message.includes('permission') ||
            createError.message.includes('policy') ||
            createError.message.includes('violates')) {
          console.log('⚠️ Bucket creation requires admin privileges')
          console.log('💡 Run supabase-storage-policies.sql to enable file upload')
          return false
        }
        
        // 버킷이 이미 존재하는 경우
        if (createError.message.includes('already exists') ||
            createError.message.includes('duplicate')) {
          console.log('✅ order-attachments bucket already exists')
          return await checkStoragePolicies()
        }
        
        console.warn('⚠️ Unexpected bucket creation error:', createError.message)
        return false
      }
      
      console.log('✅ order-attachments bucket created successfully')
    } else {
      console.log('✅ order-attachments bucket already exists')
    }

    // 4. Storage 정책 확인
    return await checkStoragePolicies()

  } catch (error: any) {
    // 모든 예외를 안전하게 처리
    console.log('⚠️ Storage initialization error (app continues normally):', error?.message || error)
    return false
  }
}

// Storage 정책 확인 함수
async function checkStoragePolicies(): Promise<boolean> {
  try {
    // 간단한 업로드 테스트로 정책 확인
    const testFile = new Blob(['test'], { type: 'text/plain' })
    const testPath = `test-${Date.now()}.txt`
    
    const { error: uploadError } = await supabase.storage
      .from('order-attachments')
      .upload(testPath, testFile)
    
    if (uploadError) {
      if (uploadError.message.includes('policy') || 
          uploadError.message.includes('row-level security')) {
        console.log('⚠️ Storage policies not configured')
        console.log('💡 Please run supabase-storage-policies.sql')
        return false
      }
    } else {
      // 테스트 파일 삭제
      await supabase.storage
        .from('order-attachments')
        .remove([testPath])
      
      console.log('✅ Storage policies are properly configured')
      return true
    }
    
    return false
  } catch (error) {
    console.log('⚠️ Storage policy check failed:', error)
    return false
  }
}

// 버킷 존재 여부만 확인하는 가벼운 함수
export async function checkStorageBucketExists(bucketName: string = 'order-attachments'): Promise<boolean> {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error || !buckets) {
      return false
    }
    
    return buckets.some(bucket => bucket.name === bucketName)
  } catch (error) {
    return false
  }
}

// 애플리케이션 시작 시 호출할 함수 (개선된 버전)
export async function setupStorage() {
  console.log('🚀 Starting storage setup...')
  
  const success = await initializeStorageBuckets()
  
  if (success) {
    console.log('✅ Storage setup completed successfully')
  } else {
    console.log('⚠️ Storage setup incomplete')
    console.log('📋 To fix this:')
    console.log('   1. Go to Supabase Dashboard > SQL Editor')
    console.log('   2. Run the supabase-storage-policies.sql file')
    console.log('   3. Or manually create Storage policies')
    console.log('💡 App will continue to work normally')
  }
  
  return success
} 