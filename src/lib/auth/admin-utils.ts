// 관리자 계정 생성 및 관리 유틸리티 함수
import { supabase } from '@/lib/supabase/client'
import { CreateUserProfile } from '@/types/auth'

// 직원 계정 생성
export async function createEmployeeAccount(profile: CreateUserProfile) {
  try {
    // 이메일 도메인 검증
    if (!profile.email.endsWith('@inkwang.co.kr')) {
      throw new Error('회사 이메일(@inkwang.co.kr)만 사용할 수 있습니다.')
    }

    // 1. 임시 비밀번호 생성 (8자리: 대문자 + 소문자 + 숫자)
    const tempPassword = generateTempPassword()

    // 2. Supabase Auth에 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: profile.email,
      password: tempPassword,
      email_confirm: false, // 이메일 인증 필요
    })

    if (authError) {
      throw new Error(`계정 생성 실패: ${authError.message}`)
    }

    // 3. 사용자 프로필 생성
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        ...profile,
        auth_user_id: authData.user.id,
        is_active: true,
      })
      .select()
      .single()

    if (profileError) {
      // 프로필 생성 실패 시 Auth 사용자도 삭제
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw new Error(`프로필 생성 실패: ${profileError.message}`)
    }

    // 4. 이메일 인증 메일 발송
    const { error: emailError } = await supabase.auth.admin.inviteUserByEmail(profile.email)

    if (emailError) {
      console.error('이메일 인증 메일 발송 실패:', emailError)
      // 이메일 발송 실패는 치명적이지 않으므로 계속 진행
    }

    return {
      success: true,
      data: {
        profile: profileData,
        tempPassword,
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }
  }
}

// 직원 계정 비활성화
export async function deactivateEmployeeAccount(email: string) {
  try {
    // 이메일 도메인 검증
    if (!email.endsWith('@inkwang.co.kr')) {
      throw new Error('회사 이메일(@inkwang.co.kr)만 사용할 수 있습니다.')
    }

    // 1. 프로필 조회
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      throw new Error('직원 정보를 찾을 수 없습니다.')
    }

    // 2. 프로필 비활성화
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ is_active: false })
      .eq('id', profile.id)

    if (updateError) {
      throw new Error(`계정 비활성화 실패: ${updateError.message}`)
    }

    // 3. Auth 사용자 비활성화
    if (profile.auth_user_id) {
      await supabase.auth.admin.updateUserById(
        profile.auth_user_id,
        { user_metadata: { disabled: true } }
      )
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }
  }
}

// 직원 비밀번호 재설정
export async function resetEmployeePassword(email: string) {
  try {
    // 이메일 도메인 검증
    if (!email.endsWith('@inkwang.co.kr')) {
      throw new Error('회사 이메일(@inkwang.co.kr)만 사용할 수 있습니다.')
    }

    // 1. 프로필 조회
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      throw new Error('직원 정보를 찾을 수 없습니다.')
    }

    // 2. 비밀번호 재설정 이메일 발송
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (resetError) {
      throw new Error(`비밀번호 재설정 이메일 발송 실패: ${resetError.message}`)
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }
  }
}

// 임시 비밀번호 생성 함수
export function generateTempPassword(length = 8) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  
  // 최소 1개의 대문자, 소문자, 숫자 포함
  const upperChars = charset.match(/[A-Z]/)
  const lowerChars = charset.match(/[a-z]/)
  const numberChars = charset.match(/[0-9]/)
  
  if (upperChars && lowerChars && numberChars) {
    password += upperChars[0] // 대문자
    password += lowerChars[0] // 소문자
    password += numberChars[0] // 숫자
  }
  
  // 나머지 문자 랜덤 생성
  for (let i = password.length; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset[randomIndex]
  }
  
  // 비밀번호 섞기
  return password.split('').sort(() => Math.random() - 0.5).join('')
}