// src/app/page.tsx
"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { AlertCircle, MapPin, Search, Droplets, Wind, RefreshCw, CloudRain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MainLayout } from '@/components/layout/main-layout'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CurrentWeather {
  location: string
  temperature: number
  description: string
  humidity: number
  windSpeed: number
  icon: string
  precipitation: {
    probability: number
    amount: number
  }
}

interface ForecastDay {
  date: Date | string
  temperature: {
    min: number
    max: number
  }
  description: string
  icon: string
  precipitation: {
    probability: number
    amount: number
  }
}

interface WeatherData {
  current: CurrentWeather
  forecast: ForecastDay[]
}

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // 한국 주요 도시 및 지역 목록 (검색 자동완성용)
  const koreanCities = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '수원', '용인', '고양', '창원', '성남', '청주', '부천', '화성',
    '안산', '안양', '진주', '포항', '김해', '제주', '천안', '전주',
    '남양주', '구미', '안동', '춘천', '원주', '강릉', '목포', '여수',
    '순천', '군산', '익산', '정읍', '김천', '경주', '거제', '통영',
    '사천', '밀양', '양산', '의정부', '시흥', '파주', '김포', '광명',
    '군포', '오산', '이천', '양주', '구리', '안성', '평택', '의왕',
    '하남', '여주', '동두천', '과천', '가평', '연천'
  ]

  // 주요 도시 목록
  const majorCities = [
    { value: 'seoul', label: '서울' },
    { value: 'incheon', label: '인천' },
    { value: 'daejeon', label: '대전' },
    { value: 'gwangju', label: '광주' },
    { value: 'daegu', label: '대구' },
    { value: 'ulsan', label: '울산' },
    { value: 'busan', label: '부산' },
    { value: 'jeju', label: '제주' }
  ]

  // 현재 위치 기반 날씨 정보 가져오기
  const fetchWeatherByLocation = async (lat: number, lon: number) => {
    try {
      console.log('현재 위치 좌표:', { lat, lon })
      const response = await fetch(
        `/api/weather?lat=${lat}&lon=${lon}`
      )
      if (!response.ok) throw new Error('날씨 정보를 가져오는데 실패했습니다.')
      const data = await response.json()
      console.log('위치 기반 날씨 데이터:', data)
      setWeatherData(data)
    } catch (error) {
      console.error('날씨 정보 조회 실패:', error)
      setError('날씨 정보를 가져오는데 실패했습니다.')
    }
  }

  // 도시 검색 기반 날씨 정보 가져오기
  const fetchWeatherByCity = async (city: string) => {
    try {
      setIsLoading(true)
      setError('')
      
      // 도시명 전처리 (공백 제거, 소문자 변환)
      const cleanCity = city.trim()
      if (!cleanCity) {
        setError('도시 이름을 입력해주세요.')
        return
      }

      const response = await fetch(`/api/weather?city=${encodeURIComponent(cleanCity)}`)
      const data = await response.json()
      
      if (!response.ok) {
        // API 오류 메시지를 사용자 친화적으로 변환
        if (data.error && data.error.includes('city not found')) {
          setError(`'${cleanCity}' 도시를 찾을 수 없습니다. 정확한 도시명을 입력해주세요.`)
        } else {
          setError(data.error || '날씨 정보를 가져오는데 실패했습니다.')
        }
        return
      }
      
      setWeatherData(data)
      setError('')
    } catch (error) {
      console.error('날씨 정보 조회 실패:', error)
      setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  // 현재 위치 가져오기
  useEffect(() => {
    // 로딩 중이면 아무것도 하지 않음 (세션 복원 대기)
    if (loading) {
      return
    }
    
    // 로딩이 완료된 후 사용자가 없으면 로그인 페이지로 이동
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (navigator.geolocation) {
      // 더 정확한 위치 정보를 위한 옵션 설정
      const options = {
        enableHighAccuracy: true, // 높은 정확도 요청
        timeout: 10000, // 10초 타임아웃
        maximumAge: 300000 // 5분간 캐시된 위치 정보 사용
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          console.log('GPS 위치 정보:', { 
            latitude, 
            longitude, 
            accuracy: `${accuracy}m`,
            timestamp: new Date(position.timestamp).toLocaleString()
          })
          fetchWeatherByLocation(latitude, longitude)
        },
        (error) => {
          console.error('위치 정보 조회 실패:', error)
          console.log('위치 오류 코드:', error.code)
          console.log('위치 오류 메시지:', error.message)
          
          // 위치 정보 실패 시 사용자에게 알림
          setError(`위치 정보를 가져올 수 없습니다: ${error.message}`)
          
          // 기본값으로 인천 날씨 표시 (사용자가 인천에 있다고 하셨으므로)
          fetchWeatherByCity('incheon')
        },
        options
      )
    } else {
      console.log('브라우저가 위치 정보를 지원하지 않습니다.')
      setError('브라우저가 위치 정보를 지원하지 않습니다.')
      // 위치 정보를 지원하지 않는 경우 인천 날씨 표시
      fetchWeatherByCity('incheon')
    }
  }, [user, loading, router])

  // 도시 선택 시 날씨 정보 업데이트
  useEffect(() => {
    if (selectedCity) {
      fetchWeatherByCity(selectedCity)
    }
  }, [selectedCity])

  // 검색어 입력 시 날씨 정보 업데이트
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedQuery = searchQuery.trim()
    
    if (!trimmedQuery) {
      setError('도시 이름을 입력해주세요.')
      return
    }
    
    if (trimmedQuery.length < 2) {
      setError('도시 이름을 2글자 이상 입력해주세요.')
      return
    }
    
    setShowSuggestions(false)
    fetchWeatherByCity(trimmedQuery)
  }

  // 검색어 자동완성 처리
  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value)
    
    if (value.length > 0) {
      const suggestions = koreanCities.filter(city => 
        city.includes(value) || city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5) // 최대 5개 제안
      
      setSearchSuggestions(suggestions)
      setShowSuggestions(suggestions.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  // 자동완성 제안 선택
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    fetchWeatherByCity(suggestion)
  }

  // 요일 이름 가져오기
  const getDayName = (date: Date | string) => {
    const days = ['일', '월', '화', '수', '목', '금', '토']
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return days[dateObj.getDay()]
  }

  // 현재 위치 새로고침
  const refreshCurrentLocation = () => {
    setError('')
    setIsLoading(true)
    
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // 캐시 사용 안함 - 새로운 위치 정보 요청
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          console.log('새로고침된 GPS 위치 정보:', { 
            latitude, 
            longitude, 
            accuracy: `${accuracy}m`,
            timestamp: new Date(position.timestamp).toLocaleString()
          })
          fetchWeatherByLocation(latitude, longitude)
          setIsLoading(false)
        },
        (error) => {
          console.error('위치 새로고침 실패:', error)
          setError(`위치 정보를 가져올 수 없습니다: ${error.message}`)
          setIsLoading(false)
        },
        options
      )
    } else {
      setError('브라우저가 위치 정보를 지원하지 않습니다.')
      setIsLoading(false)
    }
  }

  // 로딩 중이거나 사용자가 없으면 적절한 UI 표시
  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-gray-600">로딩 중...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!user) {
    return null
  }

  return (
    <MainLayout>
      <div className="py-6 w-full">
        <div className="w-full">
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">날씨 정보</CardTitle>
            </CardHeader>
            <CardContent>
              {/* 검색 폼 */}
              <div className="flex gap-4 mb-4">
                <form onSubmit={handleSearch} className="flex gap-2 flex-1 relative">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="도시 이름을 입력하세요 (예: 서울, 부산, 인천)"
                      value={searchQuery}
                      onChange={(e) => handleSearchInputChange(e.target.value)}
                      onFocus={() => searchQuery && setShowSuggestions(searchSuggestions.length > 0)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="w-full"
                    />
                    
                    {/* 자동완성 드롭다운 */}
                    {showSuggestions && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1">
                        {searchSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button type="submit" disabled={isLoading} size="sm">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
                
                {/* 현재 위치 새로고침 버튼 */}
                <Button 
                  onClick={refreshCurrentLocation} 
                  disabled={isLoading} 
                  size="sm"
                  variant="outline"
                  title="현재 위치 새로고침"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                
                {/* 주요 도시 선택 */}
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="도시 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {majorCities.map((city) => (
                      <SelectItem key={city.value} value={city.value}>
                        {city.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 날씨 정보와 7일 예보를 상단에 1행으로 배치 */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* 왼쪽: 현재 날씨 */}
                <div className="md:w-3/5 w-full">
                  {error ? (
                    <div className="text-red-500 text-center py-4">{error}</div>
                  ) : weatherData ? (
                    <div className="space-y-4">
                      {/* 현재 날씨 */}
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white h-full flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4" />
                          <h3 className="text-lg font-semibold">{weatherData.current.location}</h3>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-3xl font-bold">{Math.round(weatherData.current.temperature)}°C</p>
                            <p className="text-sm mt-1">{weatherData.current.description}</p>
                          </div>
                          <img
                            src={`http://openweathermap.org/img/wn/${weatherData.current.icon}@2x.png`}
                            alt={weatherData.current.description}
                            className="w-16 h-16"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Droplets className="h-4 w-4 text-blue-100" />
                            <span className="text-xs text-blue-100">습도</span>
                            <span className="font-semibold ml-auto">{weatherData.current.humidity}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Wind className="h-4 w-4 text-blue-100" />
                            <span className="text-xs text-blue-100">풍속</span>
                            <span className="font-semibold ml-auto">{weatherData.current.windSpeed}m/s</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Droplets className="h-4 w-4 text-blue-100" />
                            <span className="text-xs text-blue-100">강수확률</span>
                            <span className="font-semibold ml-auto">{weatherData.current.precipitation.probability}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CloudRain className="h-4 w-4 text-blue-100" />
                            <span className="text-xs text-blue-100">강수량</span>
                            <span className="font-semibold ml-auto">
                              {weatherData.current.precipitation.amount > 0 
                                ? `${weatherData.current.precipitation.amount}mm` 
                                : '0mm'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">날씨 정보를 불러오는 중...</p>
                    </div>
                  )}
                </div>
                {/* 오른쪽: 7일 예보 */}
                <div className="md:w-2/5 w-full">
                  {weatherData && weatherData.forecast && weatherData.forecast.length > 0 && (
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 shadow border h-full flex flex-col text-white">
                      <h4 className="font-semibold mb-3 text-white">6일 예보</h4>
                      <div className="grid grid-cols-6 gap-1 md:gap-2">
                        {weatherData.forecast.map((day, index) => {
                          const dayDate = new Date(day.date)
                          return (
                            <div key={index} className="text-center p-1 rounded-lg bg-blue-400/30 border border-blue-300/30">
                              <p className="text-xs font-medium text-blue-50 mb-0.5">
                                {index === 0 ? '오늘' : getDayName(dayDate)}
                              </p>
                              <img
                                src={`http://openweathermap.org/img/wn/${day.icon}.png`}
                                alt={day.description}
                                className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-0.5"
                              />
                              <p className="text-xxs md:text-xs text-blue-100 mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{day.description}</p>
                              <div className="text-xxs md:text-xs text-white">
                                <span className="font-semibold">{Math.round(day.temperature.max)}°</span>
                                <span className="text-blue-100 ml-0.5">{Math.round(day.temperature.min)}°</span>
                              </div>
                              {day.precipitation.probability > 0 && (
                                <div className="text-xxs text-blue-100 mt-0.5">
                                  {day.precipitation.probability}%
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* 추가 컨텐츠 영역 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">공지사항</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">추후 공지사항이 표시될 예정입니다.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">일정</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">추후 일정 정보가 표시될 예정입니다.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">빠른 링크</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">추후 빠른 링크가 표시될 예정입니다.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}