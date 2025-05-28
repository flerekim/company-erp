const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// 환경변수 로드 - 루트 폴더의 .env 파일
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // 서비스 키 필요

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase URL 또는 Service Role Key가 없습니다.')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '없음')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addAttachmentsColumn() {
  try {
    console.log('🔄 orders 테이블에 attachments 컬럼 추가 중...')

    // 먼저 orders 테이블에서 간단한 쿼리로 attachments 컬럼 존재 확인
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('attachments')
        .limit(1)

      if (!error) {
        console.log('✅ attachments 컬럼이 이미 존재합니다!')
        return true
      }
    } catch (e) {
      // 컬럼이 없으면 에러가 발생함
    }

    // PostgreSQL의 직접 SQL 실행을 위해 임시로 더미 데이터 생성 후 삭제하는 방식 사용
    // 실제로는 Supabase Dashboard의 SQL Editor를 사용하는 것을 권장
    console.log('⚠️  Supabase JavaScript 클라이언트로는 DDL 명령어를 직접 실행할 수 없습니다.')
    console.log('📋 다음 SQL을 Supabase Dashboard의 SQL Editor에서 실행해주세요:')
    console.log('---')
    console.log('ALTER TABLE orders ADD COLUMN attachments JSONB DEFAULT \'[]\'::jsonb;')
    console.log('COMMENT ON COLUMN orders.attachments IS \'Array of file metadata objects\';')
    console.log('CREATE INDEX idx_orders_attachments ON orders USING gin(attachments);')
    console.log('---')
    
    return false

  } catch (error) {
    console.error('❌ 예외 발생:', error)
    return false
  }
}

// 테이블 구조 확인 함수
async function checkTableStructure() {
  try {
    // 단순히 orders 테이블에서 첫 번째 레코드를 조회해서 컬럼 구조 확인
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .limit(1)

    if (!error && data && data.length > 0) {
      console.log('\n📋 현재 orders 테이블 컬럼 목록:')
      Object.keys(data[0]).forEach(column => {
        console.log(`  - ${column}`)
      })
    } else if (!error && data && data.length === 0) {
      console.log('\n📋 orders 테이블이 비어있습니다. 테스트 데이터를 추가한 후 확인하세요.')
    } else {
      console.log('❌ orders 테이블 조회 실패:', error)
    }
  } catch (error) {
    console.error('❌ 테이블 구조 확인 실패:', error)
  }
}

// 스크립트 실행
addAttachmentsColumn().then(async () => {
  await checkTableStructure()
  console.log('\n🎉 스크립트 실행 완료!')
  process.exit(0)
}).catch(error => {
  console.error('❌ 스크립트 실행 실패:', error)
  process.exit(1)
}) 