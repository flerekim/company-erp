// 직원 관리 페이지 (관리자 전용)
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { supabase } from '@/lib/supabase/client'
import { createEmployeeAccount, generateTempPassword, deactivateEmployee } from '@/lib/auth/admin-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Users, UserCheck, UserX, Key, Edit } from 'lucide-react'
import { UserProfile, CreateUserProfile } from '@/types/auth'

export default function EmployeesPage() {
  const { profile } = useAuth()
  const [employees, setEmployees] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 새 직원 생성 폼 데이터
  const [newEmployee, setNewEmployee] = useState<CreateUserProfile>({
    employee_id: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    role: 'user'
  })

  // 관리자 권한 확인
  if (profile?.role !== 'admin') {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            관리자 권한이 필요한 페이지입니다.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // 직원 목록 조회
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('직원 목록 조회 실패:', error)
      setMessage({ type: 'error', text: '직원 목록을 불러오는데 실패했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  // 새 직원 생성
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)

    try {
      // 임시 비밀번호 생성
      const tempPassword = generateTempPassword()
      
      const result = await createEmployeeAccount({
        ...newEmployee,
        password: tempPassword
      })

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `직원 계정이 생성되었습니다. 임시 비밀번호: ${result.tempPassword}` 
        })
        setShowCreateDialog(false)
        setNewEmployee({
          employee_id: '',
          name: '',
          email: '',
          phone: '',
          department: '',
          position: '',
          role: 'user'
        })
        fetchEmployees()
      } else {
        setMessage({ type: 'error', text: result.error || '계정 생성에 실패했습니다.' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '계정 생성 중 오류가 발생했습니다.' })
    } finally {
      setCreateLoading(false)
    }
  }

  // 직원 상태 변경
  const toggleEmployeeStatus = async (employeeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: !currentStatus })
        .eq('employee_id', employeeId)

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: `직원 상태가 ${!currentStatus ? '활성화' : '비활성화'}되었습니다.` 
      })
      fetchEmployees()
    } catch (error) {
      setMessage({ type: 'error', text: '상태 변경에 실패했습니다.' })
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const activeEmployees = employees.filter(emp => emp.is_active).length
  const totalEmployees = employees.length

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">직원 관리</h1>
          <p className="text-gray-600">직원 계정을 생성하고 관리합니다</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              새 직원 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>새 직원 계정 생성</DialogTitle>
              <DialogDescription>
                새로운 직원의 정보를 입력하여 계정을 생성합니다.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_id">사번*</Label>
                  <Input
                    id="employee_id"
                    value={newEmployee.employee_id}
                    onChange={(e) => setNewEmployee({...newEmployee, employee_id: e.target.value})}
                    placeholder="EMP001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">이름*</Label>
                  <Input
                    id="name"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                    placeholder="홍길동"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">이메일*</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                  placeholder="hong@company.com"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">부서</Label>
                  <Input
                    id="department"
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                    placeholder="기술팀"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">직책</Label>
                  <Input
                    id="position"
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                    placeholder="대리"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">전화번호</Label>
                  <Input
                    id="phone"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                    placeholder="010-1234-5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">권한</Label>
                  <Select 
                    value={newEmployee.role} 
                    onValueChange={(value: 'admin' | 'manager' | 'user') => 
                      setNewEmployee({...newEmployee, role: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">일반 사용자</SelectItem>
                      <SelectItem value="manager">관리자</SelectItem>
                      <SelectItem value="admin">시스템 관리자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                >
                  취소
                </Button>
                <Button type="submit" disabled={createLoading}>
                  {createLoading ? '생성 중...' : '계정 생성'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 알림 메시지 */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 직원</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}명</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 직원</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeEmployees}명</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">비활성 직원</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalEmployees - activeEmployees}명</div>
          </CardContent>
        </Card>
      </div>

      {/* 직원 목록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>직원 목록</CardTitle>
          <CardDescription>
            등록된 모든 직원의 정보를 확인하고 관리할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">직원 목록을 불러오는 중...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사번</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>부서</TableHead>
                  <TableHead>직책</TableHead>
                  <TableHead>권한</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.employee_id}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.department || '-'}</TableCell>
                    <TableCell>{employee.position || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={
                        employee.role === 'admin' ? 'destructive' :
                        employee.role === 'manager' ? 'default' : 'secondary'
                      }>
                        {employee.role === 'admin' ? '시스템관리자' :
                         employee.role === 'manager' ? '관리자' : '일반사용자'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                        {employee.is_active ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleEmployeeStatus(employee.employee_id, employee.is_active)}
                        >
                          {employee.is_active ? '비활성화' : '활성화'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}