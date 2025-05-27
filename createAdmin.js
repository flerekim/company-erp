import { config } from 'dotenv';
config(); // .env 파일 로드

import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase URL과 서비스 역할 키를 가져옵니다.
// 서비스 역할 키는 절대 클라이언트 측 코드에 노출되어서는 안 됩니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase URL 또는 서비스 역할 키 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTempAdminAccount() {
  const email = 'admin@inkwang.co.kr';
  const password = 'admin123!'; // 임시 비밀번호
  const employeeId = 'ADMIN001';
  const name = '관리자';
  const role = 'admin';
  const department = 'IT팀';
  const position = '시스템관리자';

  try {
    // 1. Supabase Auth에 사용자 생성 (Admin 권한 사용)
    // email_confirm: true로 설정하면 이메일 인증이 필요합니다.
    // 테스트를 위해 false로 설정하거나, Supabase 설정에서 이메일 확인을 비활성화할 수 있습니다.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // 실제 배포 환경에서는 true 권장
    });

    if (authError) {
      console.error('Supabase Auth 사용자 생성 실패:', authError.message);
      // 이미 존재하는 사용자일 경우를 처리
      if (authError.message.includes('already exists')) {
         console.log('사용자가 이미 존재합니다. 프로필을 연결 시도합니다.');
         // 기존 사용자를 찾아서 프로필을 업데이트하거나 생성합니다.
         await handleExistingUser(email, employeeId, name, role, department, position);
         return { success: true, message: '기존 사용자에 프로필 연결 완료.' };
      }
       throw authError; // 다른 오류는 다시 throw
    }

    console.log('Supabase Auth 사용자 생성 성공:', authData.user.id);

    // 2. user_profiles 테이블에 프로필 정보 삽입
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        auth_user_id: authData.user.id,
        employee_id: employeeId,
        name: name,
        email: email,
        role: role,
        department: department,
        position: position,
        is_active: true,
        // created_at, updated_at은 Supabase 설정에 따라 자동 생성될 수 있습니다.
        // created_by, updated_by는 필요에 따라 추가
      })
      .select()
      .single();

    if (profileError) {
      console.error('user_profiles 삽입 실패:', profileError.message);
      // 프로필 생성 실패 시 Auth 사용자 삭제 (롤백)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    console.log('관리자 프로필 생성 성공:', profileData);

    // 3. Supabase Auth 사용자의 app_metadata에 역할 추가 (RLS 정책에서 사용)
    const { data: updateMetaData, error: metaError } = await supabaseAdmin.auth.admin.updateUserById(
      authData.user.id,
      {
        app_metadata: { role: role },
      }
    );

    if (metaError) {
      console.error('Supabase Auth app_metadata 업데이트 실패:', metaError.message);
      // 메타데이터 업데이트 실패 시에도 계정 생성은 성공으로 간주 (필요에 따라 롤백 로직 추가)
    } else {
      console.log('Supabase Auth app_metadata 업데이트 성공:', updateMetaData.user?.app_metadata);
    }

    return { success: true, profile: profileData, tempPassword: password };

  } catch (error) {
    console.error('관리자 계정 생성 중 오류 발생:', error);
    return { success: false, error: error.message };
  }
}

// 이미 사용자가 존재할 경우 프로필을 업데이트하거나 생성하는 함수
async function handleExistingUser(email, employeeId, name, role, department, position) {
     try {
        // 1. Supabase Auth에서 사용자 ID 조회
        const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
        if (userError) throw userError;

        const existingAuthUser = users.users.find(user => user.email === email);

        if (!existingAuthUser) {
            console.error('기존 사용자를 Supabase Auth에서 찾을 수 없습니다.');
            return;
        }

        const authUserId = existingAuthUser.id;

        // 2. user_profiles 테이블에서 기존 프로필 조회
        const { data: existingProfile, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('auth_user_id', authUserId)
            .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116은 행이 없을 때의 오류 코드입니다.
             throw profileError;
        }

        if (existingProfile) {
            // 3. 프로필이 존재하면 업데이트
            console.log('기존 프로필 업데이트 중...');
            const { data: updatedProfile, error: updateError } = await supabaseAdmin
                .from('user_profiles')
                .update({
                    employee_id: employeeId,
                    name: name,
                    role: role,
                    department: department,
                    position: position,
                    is_active: true, // 관리자 계정은 활성화 상태로 유지
                })
                .eq('id', existingProfile.id)
                .select()
                .single();

            if (updateError) throw updateError;
            console.log('기존 프로필 업데이트 성공:', updatedProfile);

            // 기존 사용자의 app_metadata 업데이트 (RLS 정책에서 사용)
            const { data: updateMetaData, error: metaError } = await supabaseAdmin.auth.admin.updateUserById(
                authUserId,
                {
                  app_metadata: { role: role },
                }
              );
        
              if (metaError) {
                console.error('기존 사용자 app_metadata 업데이트 실패:', metaError.message);
                // 메타데이터 업데이트 실패가 로그인을 막지는 않도록 에러를 throw하지 않음
              } else {
                console.log('기존 사용자 app_metadata 업데이트 성공:', updateMetaData.user?.app_metadata);
              }

        } else {
            // 4. 프로필이 존재하지 않으면 새로 생성
            console.log('새 프로필 생성 중...');
             const { data: newProfile, error: insertError } = await supabaseAdmin
                .from('user_profiles')
                .insert({
                    auth_user_id: authUserId,
                    employee_id: employeeId,
                    name: name,
                    email: email,
                    role: role,
                    department: department,
                    position: position,
                    is_active: true,
                })
                .select()
                .single();

            if (insertError) throw insertError;
            console.log('새 프로필 생성 성공:', newProfile);

             // 새 사용자의 app_metadata 업데이트 (RLS 정책에서 사용)
             const { data: updateMetaData, error: metaError } = await supabaseAdmin.auth.admin.updateUserById(
                authUserId,
                {
                  app_metadata: { role: role },
                }
              );
        
              if (metaError) {
                console.error('새 사용자 app_metadata 업데이트 실패:', metaError.message);
                // 메타데이터 업데이트 실패가 로그인을 막지는 않도록 에러를 throw하지 않음
              } else {
                console.log('새 사용자 app_metadata 업데이트 성공:', updateMetaData.user?.app_metadata);
              }
        }

     } catch (error) {
         console.error('기존 사용자 처리 중 오류 발생:', error);
         throw error;
     }
}


createTempAdminAccount().then(result => {
  if (result.success) {
    console.log('관리자 계정 생성 또는 연결 작업 완료.');
    if (result.tempPassword) {
        console.log(`임시 비밀번호: ${result.tempPassword}`);
    }
  } else {
    console.error('관리자 계정 생성 또는 연결 작업 실패:', result.error);
  }
});
