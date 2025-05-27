// 개발용 관리자 계정 생성 스크립트
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경변수가 설정되지 않았습니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminAccount() {
  try {
    // 1. 관리자 계정 생성
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@company.com',
      password: 'admin123!',
      email_confirm: true
    })

    if (authError) {
      console.error('인증 계정 생성 실패:', authError.message)
      return
    }

    console.log('✅ 관리자 인증 계정 생성 완료')

    // 2. 프로필 업데이트
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ 
        auth_user_id: authData.user.id 
      })
      .eq('employee_id', 'ADMIN001')

    if (profileError) {
      console.error('프로필 업데이트 실패:', profileError.message)
      return
    }

    console.log('✅ 관리자 프로필 연동 완료')
    console.log('📧 이메일: admin@company.com')
    console.log('🔑 비밀번호: admin123!')
    console.log('🎉 관리자 계정 생성이 완료되었습니다!')

  } catch (error) {
    console.error('오류:', error.message)
  }
}

createAdminAccount()