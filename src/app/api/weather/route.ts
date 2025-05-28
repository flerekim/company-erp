import { NextResponse } from 'next/server'

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5'

// 한국어 도시명을 영어로 매핑하는 객체
const koreanCityMapping: { [key: string]: string } = {
  // 광역시/특별시
  '서울': 'Seoul,KR',
  '부산': 'Busan,KR',
  '대구': 'Daegu,KR',
  '인천': 'Incheon,KR',
  '광주': 'Gwangju,KR',
  '대전': 'Daejeon,KR',
  '울산': 'Ulsan,KR',
  '세종': 'Sejong,KR',
  
  // 경기도
  '수원': 'Suwon,KR',
  '용인': 'Yongin,KR',
  '고양': 'Goyang,KR',
  '성남': 'Seongnam,KR',
  '부천': 'Bucheon,KR',
  '화성': 'Hwaseong,KR',
  '안산': 'Ansan,KR',
  '안양': 'Anyang,KR',
  '남양주': 'Namyangju,KR',
  '의정부': 'Uijeongbu,KR',
  '시흥': 'Siheung,KR',
  '파주': 'Paju,KR',
  '김포': 'Gimpo,KR',
  '광명': 'Gwangmyeong,KR',
  '군포': 'Gunpo,KR',
  '오산': 'Osan,KR',
  '이천': 'Icheon,KR',
  '양주': 'Yangju,KR',
  '구리': 'Guri,KR',
  '안성': 'Anseong,KR',
  '평택': 'Pyeongtaek,KR',
  '의왕': 'Uiwang,KR',
  '하남': 'Hanam,KR',
  '여주': 'Yeoju,KR',
  '동두천': 'Dongducheon,KR',
  '과천': 'Gwacheon,KR',
  '가평': 'Gapyeong,KR',
  '연천': 'Yeoncheon,KR',
  
  // 강원도
  '춘천': 'Chuncheon,KR',
  '원주': 'Wonju,KR',
  '강릉': 'Gangneung,KR',
  
  // 충청도
  '청주': 'Cheongju,KR',
  '천안': 'Cheonan,KR',
  
  // 전라도
  '전주': 'Jeonju,KR',
  '목포': 'Mokpo,KR',
  '여수': 'Yeosu,KR',
  '순천': 'Suncheon,KR',
  '군산': 'Gunsan,KR',
  '익산': 'Iksan,KR',
  '정읍': 'Jeongeup,KR',
  
  // 경상도
  '창원': 'Changwon,KR',
  '진주': 'Jinju,KR',
  '포항': 'Pohang,KR',
  '김해': 'Gimhae,KR',
  '구미': 'Gumi,KR',
  '안동': 'Andong,KR',
  '김천': 'Gimcheon,KR',
  '경주': 'Gyeongju,KR',
  '거제': 'Geoje,KR',
  '통영': 'Tongyeong,KR',
  '사천': 'Sacheon,KR',
  '밀양': 'Miryang,KR',
  '양산': 'Yangsan,KR',
  
  // 제주도
  '제주': 'Jeju,KR'
}

// 영어 도시명을 한글로 변환하는 역방향 매핑 객체
const englishToKoreanCityMapping: { [key: string]: string } = {
  // 광역시/특별시
  'seoul': '서울',
  'busan': '부산',
  'daegu': '대구',
  'incheon': '인천',
  'gwangju': '광주',
  'daejeon': '대전',
  'ulsan': '울산',
  'sejong': '세종',
  
  // 경기도
  'suwon': '수원',
  'yongin': '용인',
  'goyang': '고양',
  'seongnam': '성남',
  'bucheon': '부천',
  'hwaseong': '화성',
  'ansan': '안산',
  'anyang': '안양',
  'namyangju': '남양주',
  'uijeongbu': '의정부',
  'siheung': '시흥',
  'paju': '파주',
  'gimpo': '김포',
  'gimpo-si': '김포',
  'gwangmyeong': '광명',
  'gunpo': '군포',
  'osan': '오산',
  'icheon': '이천',
  'yangju': '양주',
  'guri': '구리',
  'anseong': '안성',
  'pyeongtaek': '평택',
  'uiwang': '의왕',
  'hanam': '하남',
  'yeoju': '여주',
  'dongducheon': '동두천',
  'gwacheon': '과천',
  'gapyeong': '가평',
  'yeoncheon': '연천',
  
  // 강원도
  'chuncheon': '춘천',
  'wonju': '원주',
  'gangneung': '강릉',
  
  // 충청도
  'cheongju': '청주',
  'cheonan': '천안',
  
  // 전라도
  'jeonju': '전주',
  'mokpo': '목포',
  'yeosu': '여수',
  'suncheon': '순천',
  'gunsan': '군산',
  'iksan': '익산',
  'jeongeup': '정읍',
  
  // 경상도
  'changwon': '창원',
  'jinju': '진주',
  'pohang': '포항',
  'gimhae': '김해',
  'gumi': '구미',
  'andong': '안동',
  'gimcheon': '김천',
  'gyeongju': '경주',
  'geoje': '거제',
  'tongyeong': '통영',
  'sacheon': '사천',
  'miryang': '밀양',
  'yangsan': '양산',
  
  // 제주도
  'jeju': '제주'
}

// 영어 날씨 설명을 한글로 번역하는 함수
function translateWeatherDescription(description: string): string {
  const weatherTranslations: { [key: string]: string } = {
    // Clear
    'clear sky': '맑음',
    'clear': '맑음',
    
    // Clouds
    'few clouds': '구름 조금',
    'scattered clouds': '구름 많음',
    'broken clouds': '구름 많음',
    'overcast clouds': '흐림',
    'clouds': '흐림',
    'cloudy': '흐림',
    
    // Rain
    'light rain': '가벼운 비',
    'moderate rain': '비',
    'heavy intensity rain': '강한 비',
    'very heavy rain': '매우 강한 비',
    'extreme rain': '극심한 비',
    'freezing rain': '우박',
    'light intensity shower rain': '소나기',
    'shower rain': '소나기',
    'heavy intensity shower rain': '강한 소나기',
    'ragged shower rain': '불규칙한 소나기',
    'rain': '비',
    
    // Snow
    'light snow': '가벼운 눈',
    'snow': '눈',
    'heavy snow': '많은 눈',
    'sleet': '진눈깨비',
    'light shower sleet': '가벼운 진눈깨비',
    'shower sleet': '진눈깨비',
    'light rain and snow': '비와 눈',
    'rain and snow': '비와 눈',
    'light shower snow': '가벼운 눈',
    'shower snow': '눈',
    'heavy shower snow': '많은 눈',
    
    // Drizzle
    'light intensity drizzle': '가벼운 이슬비',
    'drizzle': '이슬비',
    'heavy intensity drizzle': '강한 이슬비',
    'light intensity drizzle rain': '가벼운 이슬비',
    'drizzle rain': '이슬비',
    'heavy intensity drizzle rain': '강한 이슬비',
    'shower rain and drizzle': '소나기와 이슬비',
    'heavy shower rain and drizzle': '강한 소나기와 이슬비',
    'shower drizzle': '이슬비',
    
    // Thunderstorm
    'thunderstorm with light rain': '가벼운 비를 동반한 천둥번개',
    'thunderstorm with rain': '비를 동반한 천둥번개',
    'thunderstorm with heavy rain': '강한 비를 동반한 천둥번개',
    'light thunderstorm': '가벼운 천둥번개',
    'thunderstorm': '천둥번개',
    'heavy thunderstorm': '강한 천둥번개',
    'ragged thunderstorm': '불규칙한 천둥번개',
    'thunderstorm with light drizzle': '가벼운 이슬비를 동반한 천둥번개',
    'thunderstorm with drizzle': '이슬비를 동반한 천둥번개',
    'thunderstorm with heavy drizzle': '강한 이슬비를 동반한 천둥번개',
    
    // Atmosphere
    'mist': '박무',
    'smoke': '연기',
    'haze': '연무',
    'sand/dust whirls': '모래/먼지 소용돌이',
    'fog': '안개',
    'sand': '모래',
    'dust': '먼지',
    'volcanic ash': '화산재',
    'squalls': '돌풍',
    'tornado': '토네이도'
  }
  
  // 소문자로 변환하여 매핑 찾기
  const lowerDescription = description.toLowerCase()
  return weatherTranslations[lowerDescription] || description
}

// 도시명을 영어로 변환하는 함수
function translateCityName(cityName: string): string {
  const trimmedCity = cityName.trim()
  
  // 한국어 매핑이 있는 경우 영어명 반환
  if (koreanCityMapping[trimmedCity]) {
    return koreanCityMapping[trimmedCity]
  }
  
  // 영어로 입력된 경우 그대로 반환 (국가 코드가 없으면 추가)
  if (/^[a-zA-Z\s]+$/.test(trimmedCity)) {
    return trimmedCity.includes(',') ? trimmedCity : `${trimmedCity},KR`
  }
  
  // 매핑되지 않은 한국어 도시명의 경우 그대로 반환
  return trimmedCity
}

// 영어 도시명을 한글로 변환하는 함수
function translateCityNameToKorean(englishCityName: string): string {
  if (!englishCityName) return ''
  
  // 소문자로 변환하고 특수문자 제거
  const cleanName = englishCityName.toLowerCase()
    .replace(/[\s-_]/g, '') // 공백, 하이픈, 언더스코어 제거
    .replace(/si$/, '') // 끝에 'si' 제거
    .replace(/city$/, '') // 끝에 'city' 제거
  
  // 정확한 매핑이 있는지 확인
  if (englishToKoreanCityMapping[englishCityName.toLowerCase()]) {
    return englishToKoreanCityMapping[englishCityName.toLowerCase()]
  }
  
  // 클린한 이름으로 다시 시도
  if (englishToKoreanCityMapping[cleanName]) {
    return englishToKoreanCityMapping[cleanName]
  }
  
  // 매핑되지 않은 경우 원본 반환
  return englishCityName
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    const city = searchParams.get('city')

    console.log('날씨 API 요청 파라미터:', { lat, lon, city })

    if (!OPENWEATHER_API_KEY) {
      throw new Error('OpenWeather API 키가 설정되지 않았습니다.')
    }

    let currentWeatherUrl = `${OPENWEATHER_BASE_URL}/weather?appid=${OPENWEATHER_API_KEY}&units=metric&lang=kr`
    let forecastUrl = `${OPENWEATHER_BASE_URL}/forecast?appid=${OPENWEATHER_API_KEY}&units=metric&lang=kr`
    
    if (lat && lon) {
      currentWeatherUrl += `&lat=${lat}&lon=${lon}`
      forecastUrl += `&lat=${lat}&lon=${lon}`
      console.log('좌표 기반 요청:', { lat, lon })
    } else if (city) {
      // 도시명을 영어로 변환
      const translatedCity = translateCityName(city)
      currentWeatherUrl += `&q=${encodeURIComponent(translatedCity)}`
      forecastUrl += `&q=${encodeURIComponent(translatedCity)}`
      console.log('도시 기반 요청:', { 
        original: city, 
        translated: translatedCity 
      })
    } else {
      return NextResponse.json(
        { error: '위치 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('OpenWeather API URLs:', { currentWeatherUrl, forecastUrl })

    // 현재 날씨와 예보 데이터를 병렬로 가져오기
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(currentWeatherUrl),
      fetch(forecastUrl)
    ])

    const currentData = await currentResponse.json()
    const forecastData = await forecastResponse.json()

    console.log('OpenWeather 현재 날씨 응답:', {
      name: currentData.name,
      country: currentData.sys?.country,
      coord: currentData.coord,
      requestedCoords: lat && lon ? { lat: parseFloat(lat), lon: parseFloat(lon) } : null
    })

    if (!currentResponse.ok) {
      console.error('현재 날씨 API 오류:', currentData)
      
      // OpenWeatherMap API 오류 코드에 따른 구체적인 메시지
      if (currentResponse.status === 404) {
        return NextResponse.json(
          { error: 'city not found - 입력하신 도시를 찾을 수 없습니다.' },
          { status: 404 }
        )
      } else if (currentResponse.status === 401) {
        return NextResponse.json(
          { error: 'API 키가 유효하지 않습니다.' },
          { status: 401 }
        )
      } else if (currentResponse.status === 429) {
        return NextResponse.json(
          { error: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' },
          { status: 429 }
        )
      }
      
      throw new Error(currentData.message || '현재 날씨 정보를 가져오는데 실패했습니다.')
    }

    if (!forecastResponse.ok) {
      console.error('예보 API 오류:', forecastData)
      
      // 예보 데이터 실패는 현재 날씨만 반환하도록 처리
      console.warn('예보 데이터를 가져올 수 없어 현재 날씨만 표시합니다.')
      
      const weatherData = {
        current: {
          location: translateCityNameToKorean(currentData.name),
          temperature: currentData.main.temp,
          description: translateWeatherDescription(currentData.weather[0].description),
          humidity: currentData.main.humidity,
          windSpeed: currentData.wind.speed,
          icon: currentData.weather[0].icon,
          precipitation: {
            probability: 0, // 현재 날씨에는 강수확률이 없으므로 0
            amount: currentData.rain?.['1h'] || currentData.rain?.['3h'] || 0 // 1시간 또는 3시간 강수량
          }
        },
        forecast: [] // 빈 배열로 반환
      }
      
      return NextResponse.json(weatherData)
    }

    // 7일 예보 데이터 가공 (5일 예보에서 하루에 하나씩 선택)
    const dailyForecasts = []
    const processedDates = new Set()
    
    for (const item of forecastData.list) {
      const date = new Date(item.dt * 1000).toDateString()
      if (!processedDates.has(date) && dailyForecasts.length < 7) {
        processedDates.add(date)
        dailyForecasts.push({
          date: new Date(item.dt * 1000),
          temperature: {
            min: item.main.temp_min,
            max: item.main.temp_max
          },
          description: translateWeatherDescription(item.weather[0].description),
          icon: item.weather[0].icon,
          precipitation: {
            probability: Math.round((item.pop || 0) * 100), // 강수확률을 백분율로 변환
            amount: item.rain?.['3h'] || item.rain?.['1h'] || 0 // 3시간 또는 1시간 강수량
          }
        })
      }
    }

    // 응답 데이터 가공
    const weatherData = {
      current: {
        location: translateCityNameToKorean(currentData.name),
        temperature: currentData.main.temp,
        description: translateWeatherDescription(currentData.weather[0].description),
        humidity: currentData.main.humidity,
        windSpeed: currentData.wind.speed,
        icon: currentData.weather[0].icon,
        precipitation: {
          probability: 0, // 현재 날씨에는 강수확률이 없으므로 0
          amount: currentData.rain?.['1h'] || currentData.rain?.['3h'] || 0 // 1시간 또는 3시간 강수량
        }
      },
      forecast: dailyForecasts
    }

    return NextResponse.json(weatherData)
  } catch (error: any) {
    console.error('날씨 API 오류:', error)
    return NextResponse.json(
      { error: error.message || '날씨 정보를 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
} 