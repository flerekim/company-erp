"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth/auth-context"
import {
  Upload,
  Download,
  Trash2,
  FileText,
  File,
  Image,
  FileSpreadsheet,
  X,
  Plus,
  Loader2,
  AlertCircle
} from "lucide-react"
import { OrderFile } from "@/types/order"
import { FileUploadService } from "@/lib/supabase/file-upload"

interface FileManagerDialogProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderNumber: string
  projectName: string
}

export function FileManagerDialog({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  projectName
}: FileManagerDialogProps) {
  const { toast } = useToast()
  const { profile } = useAuth() // 로그인 사용자 정보 가져오기
  
  // 상태 관리
  const [files, setFiles] = useState<OrderFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // 파일 목록 조회
  const fetchFiles = async () => {
    if (!orderId) {
      setFiles([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const fileList = await FileUploadService.getOrderFiles(orderId)
      setFiles(fileList)
    } catch (error: any) {
      console.error('[FileManagerDialog] 파일 목록 조회 실패:', error?.message || error)
      
      // Storage 관련 오류인지 확인
      const errorMessage = error?.message || error?.toString() || ''
      
      if (errorMessage.includes('policy') || 
          errorMessage.includes('row-level security')) {
        toast({
          title: "Storage 정책 설정 필요",
          description: "Storage 정책이 설정되지 않았습니다. supabase-storage-policies.sql 파일을 실행하거나 관리자에게 문의하세요.",
          variant: "destructive"
        })
      } else if (errorMessage.includes('bucket') || 
                 errorMessage.includes('storage')) {
        toast({
          title: "Storage 설정 필요",
          description: "파일 Storage가 설정되지 않았습니다. 관리자에게 문의하세요.",
          variant: "destructive"
        })
      } else if (errorMessage.includes('permission')) {
        toast({
          title: "권한 부족",
          description: "Storage 접근 권한이 없습니다. 관리자에게 권한 설정을 요청하세요.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "오류",
          description: "파일 목록을 불러오는데 실패했습니다.",
          variant: "destructive"
        })
      }
      
      // 오류 발생 시에도 빈 배열로 설정하여 UI 깨짐 방지
      setFiles([])
    } finally {
      setIsLoading(false)
    }
  }

  // 컴포넌트 마운트 시 파일 목록 조회
  useEffect(() => {
    if (isOpen && orderId) {
      fetchFiles()
    } else if (!isOpen) {
      // 다이얼로그가 닫힐 때 파일 목록 초기화 (선택적)
      // setFiles([]); 
      // setSelectedFiles([]);
    }
  }, [isOpen, orderId])

  // 파일 선택 처리
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(prev => [...prev, ...files])
  }

  // 드래그 앤 드롭 처리
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files])
    }
  }

  // 선택된 파일 제거
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // 파일 업로드
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    try {
      setIsUploading(true)
      
      // 모든 파일을 'other' 타입으로 업로드
      const uploadPromises = selectedFiles.map(file => 
        FileUploadService.uploadFile(file, orderId, 'other')
      )
      
      const results = await Promise.all(uploadPromises)
      
      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length
      
      if (successCount > 0) {
        toast({
          title: "업로드 완료",
          description: `${successCount}개 파일이 성공적으로 업로드되었습니다.`,
          duration: 2000
        })
        setSelectedFiles([])
        await fetchFiles() // 파일 목록 새로고침
      }
      
      if (failCount > 0) {
        toast({
          title: failCount === results.length ? "업로드 실패" : "일부 업로드 실패",
          description: `${failCount}개 파일 업로드에 실패했습니다.`,
          variant: "destructive",
          duration: 2000
        })
      }
    } catch (error) {
      console.error('파일 업로드 실패:', error)
      toast({
        title: "오류",
        description: "파일 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
        duration: 2000
      })
    } finally {
      setIsUploading(false)
    }
  }

  // 파일 삭제
  const handleDelete = async (fileId: string) => {
    try {
      const result = await FileUploadService.deleteFile(fileId)
      
      if (result.success) {
        toast({
          title: "삭제 완료",
          description: "파일이 성공적으로 삭제되었습니다.",
          duration: 2000
        })
        await fetchFiles() // 파일 목록 새로고침
      } else {
        toast({
          title: "삭제 실패",
          description: result.error || "파일 삭제에 실패했습니다.",
          variant: "destructive",
          duration: 2000
        })
      }
    } catch (error) {
      console.error('파일 삭제 실패:', error)
      toast({
        title: "오류",
        description: "파일 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
        duration: 2000
      })
    } finally {
      setDeleteFileId(null)
    }
  }

  // 파일 다운로드
  const handleDownload = async (file: OrderFile) => {
    try {
      const downloadUrl = await FileUploadService.getDownloadUrl(file.file_url)
      
      // 새 창에서 다운로드
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = file.file_name
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "다운로드 시작",
        description: `${file.file_name} 다운로드를 시작합니다.`,
        duration: 2000
      })
    } catch (error) {
      console.error('파일 다운로드 실패:', error)
      toast({
        title: "다운로드 실패",
        description: "파일 다운로드에 실패했습니다.",
        variant: "destructive",
        duration: 2000
      })
    }
  }

  // 파일 타입 아이콘 가져오기
  const getFileTypeIcon = (fileType: OrderFile['file_type']) => {
    switch (fileType) {
      case 'contract':
        return <FileText className="h-5 w-5 text-blue-600" />
      case 'drawing':
        return <Image className="h-5 w-5 text-green-600" />
      case 'report':
        return <FileSpreadsheet className="h-5 w-5 text-orange-600" />
      case 'certificate':
        return <File className="h-5 w-5 text-purple-600" />
      default:
        return <File className="h-5 w-5 text-gray-600" />
    }
  }

  // 파일 타입 라벨 가져오기
  const getFileTypeLabel = (fileType: OrderFile['file_type']) => {
    const labels = {
      contract: '계약서',
      drawing: '도면',
      report: '보고서',
      certificate: '인증서',
      other: '기타'
    }
    return labels[fileType]
  }

  // 파일 타입 배지 색상
  const getFileTypeBadgeColor = (fileType: OrderFile['file_type']) => {
    const colors = {
      contract: 'bg-blue-100 text-blue-800',
      drawing: 'bg-green-100 text-green-800',
      report: 'bg-orange-100 text-orange-800',
      certificate: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return colors[fileType]
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[1200px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              파일 관리 - {projectName}
            </DialogTitle>
            <DialogDescription>
              {projectName} 프로젝트의 파일을 관리합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto space-y-6">
            {/* 파일 업로드 영역 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">파일 업로드</CardTitle>
                <CardDescription>
                  드래그 앤 드롭으로 파일을 업로드하거나 파일 선택 버튼을 클릭하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 드래그 앤 드롭 영역 */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-600 mb-2">
                    파일을 여기로 드래그하세요
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    또는 아래 버튼을 클릭하여 파일을 선택하세요
                  </p>
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="transition-all duration-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 hover:scale-105"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    파일 선택
                  </Button>
                </div>

                {/* 선택된 파일 목록 */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">선택된 파일 ({selectedFiles.length}개)</h4>
                    <div className="space-y-2 max-h-32 overflow-auto">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4 text-gray-500" />
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({FileUploadService.formatFileSize(file.size)})
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSelectedFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* 파일 타입 선택 및 업로드 버튼 */}
                    <div className="flex items-center justify-end gap-4">
                      <Button
                        onClick={handleUpload}
                        disabled={isUploading || selectedFiles.length === 0}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            업로드 중...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            업로드 ({selectedFiles.length})
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 파일 목록 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">등록된 파일 ({files.length}개)</CardTitle>
                <CardDescription>
                  프로젝트에 등록된 모든 파일을 확인하고 관리할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : files.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p>등록된 파일이 없습니다.</p>
                    <p className="text-sm">위에서 파일을 업로드해보세요.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>파일명</TableHead>
                          <TableHead>크기</TableHead>
                          <TableHead>업로드일</TableHead>
                          <TableHead>업로드자</TableHead>
                          <TableHead className="text-right">작업</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {files.map((file) => (
                          <TableRow key={file.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getFileTypeIcon(file.file_type)}
                                <span className="font-medium">{file.file_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {FileUploadService.formatFileSize(file.file_size)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {formatDate(file.uploaded_at)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {profile?.name || '알 수 없음'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownload(file)}
                                  title="다운로드"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteFileId(file.id)}
                                  title="삭제"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 닫기 버튼 */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 파일 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteFileId} onOpenChange={() => setDeleteFileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              파일 삭제 확인
            </AlertDialogTitle>
            <AlertDialogDescription>
              선택한 파일을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFileId && handleDelete(deleteFileId)}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 