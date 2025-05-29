"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Building, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ProjectCreationDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (projectName: string) => Promise<void>
  isLoading: boolean
}

export function ProjectCreationDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading 
}: ProjectCreationDialogProps) {
  const [projectName, setProjectName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim()) return
    
    setError(null)
    try {
      await onSubmit(projectName.trim())
      setProjectName('') // 성공 시 입력 필드 초기화
      toast({
        title: "프로젝트 생성 완료",
        description: `'${projectName.trim()}' 프로젝트가 성공적으로 생성되었습니다.`,
        variant: "success",
        duration: 2000,
      })
    } catch (err: any) {
      setError(err.message || "프로젝트 생성 중 오류가 발생했습니다.")
      toast({
        title: "프로젝트 생성 실패",
        description: err.message || "프로젝트 생성 중 오류가 발생했습니다.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setProjectName('')
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-600" />
            새 프로젝트 생성
          </DialogTitle>
          <DialogDescription>
            신규 수주를 위한 프로젝트를 생성합니다. 프로젝트명을 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">프로젝트명 *</Label>
            <Input
              id="project-name"
              placeholder="예: 서울시 강남구 토양정화 프로젝트"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={isLoading}
              autoFocus
              className="w-full"
            />
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            <p className="text-xs text-gray-500">
              프로젝트명은 나중에 수정할 수 있습니다.
            </p>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !projectName.trim()}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  생성 중...
                </>
              ) : (
                '프로젝트 생성'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 
 