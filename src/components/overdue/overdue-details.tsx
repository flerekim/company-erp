// src/components/overdue/overdue-details.tsx
// 연체 채권 상세 정보 컴포넌트

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertTriangle,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  FileText,
  Clock,
  User,
  Building,
  Target,
  TrendingDown,
  CheckCircle,
  Plus
} from "lucide-react"
import { Receivable } from "@/types/receivables"

interface OverdueDetailsProps {
  receivable: Receivable
}

export function OverdueDetails({ receivable }: OverdueDetailsProps) {
  const [newActionType, setNewActionType] = useState<string>("")
  const [newActionDescription, setNewActionDescription] = useState("")
  const [newActionDate, setNewActionDate] = useState(new Date().toISOString().split('T')[0])
  const [nextActionDate, setNextActionDate] = useState("")
  const [actionMemo, setActionMemo] = useState("")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getOverdueLevelInfo = (level: string) => {
    switch (level) {
      case 'bad':
        return {
          label: '부실채권',
          color: 'bg-red-100 text-red-800 border-red-200',
          description: '181일 이상 연체 - 법적 조치 검토 필요',
          risk: '매우 높음',
          riskColor: 'text-red-600'
        }
      case 'longterm':
        return {
          label: '장기연체',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          description: '91-180일 연체 - 적극적 수금 필요',
          risk: '높음',
          riskColor: 'text-orange-600'
        }
      case 'warning':
        return {
          label: '주의',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          description: '61-90일 연체 - 지속적 관리 필요',
          risk: '보통',
          riskColor: 'text-yellow-600'
        }
      default:
        return {
          label: '정상',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          description: '60일 이내',
          risk: '낮음',
          riskColor: 'text-blue-600'
        }
    }
  }

  const overdueInfo = getOverdueLevelInfo(receivable.overdue_level)

  // 임시 연체 이력 데이터
  const overdueHistory = [
    {
      id: 1,
      action_date: '2024-05-20',
      action_type: 'call',
      action_description: '담당자 연락 - 5월 말 입금 약속',
      result: 'promised',
      next_action_date: '2024-05-31',
      memo: '담당자: 김과장, 연락처: 010-1234-5678'
    },
    {
      id: 2,
      action_date: '2024-05-10',
      action_type: 'email',
      action_description: '정식 독촉장 발송',
      result: 'no_response',
      next_action_date: '2024-05-20',
      memo: '공문 발송 완료'
    },
    {
      id: 3,
      action_date: '2024-04-25',
      action_type: 'call',
      action_description: '1차 전화 독촉',
      result: 'promised',
      next_action_date: '2024-05-10',
      memo: '예산 사정으로 지연, 5월 중 입금 약속'
    }
  ]

  const actionTypeLabels = {
    call: '전화연락',
    email: '이메일 발송',
    visit: '방문상담',
    letter: '공문발송',
    legal: '법적조치'
  }

  const resultLabels = {
    no_response: '무응답',
    promised: '입금약속',
    partial_payment: '부분입금',
    full_payment: '완납',
    dispute: '이의제기'
  }

  const handleAddAction = () => {
    // TODO: Supabase에 새로운 액션 추가
    console.log('새 액션 추가:', {
      receivable_id: receivable.id,
      action_type: newActionType,
      action_description: newActionDescription,
      action_date: newActionDate,
      next_action_date: nextActionDate,
      memo: actionMemo
    })
    
    // 폼 리셋
    setNewActionType("")
    setNewActionDescription("")
    setNewActionDate(new Date().toISOString().split('T')[0])
    setNextActionDate("")
    setActionMemo("")
    
    alert('새로운 조치가 등록되었습니다.')
  }

  return (
    <div className="space-y-6">
      {/* 채권 기본 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              채권 기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-500">채권번호</Label>
                <div className="font-mono text-base">{receivable.receivable_number}</div>
              </div>
              <div>
                <Label className="text-gray-500">수주번호</Label>
                <div className="font-mono">{receivable.order_number}</div>
              </div>
              <div className="col-span-2">
                <Label className="text-gray-500">프로젝트명</Label>
                <div className="font-medium">{receivable.project_name}</div>
              </div>
              <div>
                <Label className="text-gray-500">고객사</Label>
                <div className="flex items-center gap-2">
                  <Badge className={
                    receivable.client_type === 'government' 
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-cyan-100 text-cyan-800'
                  }>
                    {receivable.client_type === 'government' ? '관수' : '민수'}
                  </Badge>
                  <span>{receivable.company_name}</span>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">담당자</Label>
                <div>{receivable.primary_manager}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              금액 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between">
                <span className="text-gray-500">총 계약금액</span>
                <span className="font-semibold">{formatCurrency(receivable.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">기입금액</span>
                <span className="font-semibold text-green-600">{formatCurrency(receivable.paid_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">미수금액</span>
                <span className="font-semibold text-red-600">{formatCurrency(receivable.remaining_amount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-gray-500">수금률</span>
                <span className="font-semibold">
                  {Math.round((receivable.paid_amount / receivable.total_amount) * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 연체 상세 정보 */}
      <Card className={`border-2 ${overdueInfo.color.replace('bg-', 'border-').replace('text-', '')}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            연체 상세 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label className="text-gray-500">연체 단계</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={overdueInfo.color}>
                  {overdueInfo.label}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-gray-500">연체 일수</Label>
              <div className="text-2xl font-bold text-red-600">{receivable.overdue_days}일</div>
            </div>
            <div>
              <Label className="text-gray-500">만료일</Label>
              <div className="font-medium">{formatDate(receivable.due_date)}</div>
            </div>
            <div>
              <Label className="text-gray-500">위험도</Label>
              <div className={`font-semibold ${overdueInfo.riskColor}`}>{overdueInfo.risk}</div>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">{overdueInfo.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* 탭 영역 */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">연체 이력</TabsTrigger>
          <TabsTrigger value="action">새 조치 등록</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                연체 관리 이력
              </CardTitle>
              <CardDescription>
                연체 관리를 위해 수행한 조치들의 이력입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overdueHistory.map((history, index) => (
                  <div key={history.id} className="flex gap-4 p-4 border rounded-lg">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      {index < overdueHistory.length - 1 && (
                        <div className="w-px h-16 bg-gray-200 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          {actionTypeLabels[history.action_type as keyof typeof actionTypeLabels]}
                        </Badge>
                        <span className="text-sm text-gray-500">{formatDate(history.action_date)}</span>
                      </div>
                      <div className="font-medium mb-1">{history.action_description}</div>
                      <div className="text-sm text-gray-600 mb-2">
                        결과: <span className="font-medium">
                          {resultLabels[history.result as keyof typeof resultLabels]}
                        </span>
                      </div>
                      {history.memo && (
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {history.memo}
                        </div>
                      )}
                      {history.next_action_date && (
                        <div className="text-sm text-blue-600 mt-2">
                          다음 조치 예정: {formatDate(history.next_action_date)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="action" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                새로운 조치 등록
              </CardTitle>
              <CardDescription>
                연체 관리를 위한 새로운 조치를 등록하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>조치 유형 *</Label>
                  <Select value={newActionType} onValueChange={setNewActionType}>
                    <SelectTrigger>
                      <SelectValue placeholder="조치 유형을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">전화연락</SelectItem>
                      <SelectItem value="email">이메일 발송</SelectItem>
                      <SelectItem value="visit">방문상담</SelectItem>
                      <SelectItem value="letter">공문발송</SelectItem>
                      <SelectItem value="legal">법적조치</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>조치일 *</Label>
                  <Input
                    type="date"
                    value={newActionDate}
                    onChange={(e) => setNewActionDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>조치 내용 *</Label>
                <Textarea
                  placeholder="수행한 조치의 상세 내용을 입력하세요"
                  value={newActionDescription}
                  onChange={(e) => setNewActionDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>다음 조치 예정일</Label>
                <Input
                  type="date"
                  value={nextActionDate}
                  onChange={(e) => setNextActionDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>메모</Label>
                <Textarea
                  placeholder="추가 메모나 특이사항을 입력하세요"
                  value={actionMemo}
                  onChange={(e) => setActionMemo(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  onClick={handleAddAction}
                  disabled={!newActionType || !newActionDescription}
                >
                  조치 등록
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 빠른 액션 버튼 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            빠른 액션
          </CardTitle>
          <CardDescription>
            자주 사용하는 연체 관리 액션들을 빠르게 실행할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => alert(`${receivable.company_name}에 전화연락을 진행합니다.`)}
            >
              <Phone className="h-4 w-4 mr-2" />
              전화연락
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => alert(`${receivable.company_name}에 독촉 이메일을 발송합니다.`)}
            >
              <Mail className="h-4 w-4 mr-2" />
              독촉 이메일
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => alert('정식 독촉장을 생성합니다.')}
            >
              <FileText className="h-4 w-4 mr-2" />
              독촉장 발송
            </Button>
            {receivable.overdue_level === 'bad' && (
              <Button 
                variant="outline" 
                size="sm"
                className="text-red-600 border-red-200"
                onClick={() => alert('법적 조치 절차를 시작합니다.')}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                법적조치
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 리스크 평가 및 회수 전망 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            리스크 평가 및 회수 전망
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold mb-2 text-blue-600">
                {Math.round((receivable.paid_amount / receivable.total_amount) * 100)}%
              </div>
              <div className="text-sm text-gray-600">현재 수금률</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold mb-2 text-orange-600">
                {receivable.overdue_level === 'bad' ? '20%' : 
                 receivable.overdue_level === 'longterm' ? '60%' : 
                 receivable.overdue_level === 'warning' ? '80%' : '95%'}
              </div>
              <div className="text-sm text-gray-600">예상 회수율</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold mb-2 text-green-600">
                {receivable.overdue_level === 'bad' ? '6개월' : 
                 receivable.overdue_level === 'longterm' ? '3개월' : 
                 receivable.overdue_level === 'warning' ? '2개월' : '1개월'}
              </div>
              <div className="text-sm text-gray-600">예상 회수기간</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>권장 조치:</strong> 
              {receivable.overdue_level === 'bad' ? ' 법적 조치 검토 및 변제계획서 요구' :
               receivable.overdue_level === 'longterm' ? ' 방문 상담을 통한 직접 협의' :
               receivable.overdue_level === 'warning' ? ' 주 1회 전화 독촉 및 이메일 발송' :
               ' 정기적인 모니터링'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}