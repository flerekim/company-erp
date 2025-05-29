"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, AlertCircle } from "lucide-react"
import { ContaminationItem, CONTAMINATION_TYPES } from "@/types/order"

interface ContaminationSectionProps {
  contaminationList: ContaminationItem[]
  onAdd: () => void
  onRemove: (index: number) => void
  onChange: (index: number, field: 'type' | 'value', value: any) => void
  error?: string
}

export function ContaminationSection({ 
  contaminationList, 
  onAdd, 
  onRemove, 
  onChange, 
  error 
}: ContaminationSectionProps) {
  // 유효성 검사
  const hasEmptyItems = contaminationList.some(item => !item.type || !item.value || item.value <= 0)
  const hasDuplicateTypes = contaminationList.length > 1 && 
    new Set(contaminationList.map(item => item.type).filter(Boolean)).size !== 
    contaminationList.filter(item => item.type).length

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>오염 정보 *</Label>
        {contaminationList.length === 0 && (
          <span className="text-sm text-gray-500">(최소 1개 이상 입력해주세요)</span>
        )}
      </div>
      
      {contaminationList.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-3">오염 정보를 추가해주세요</p>
          <Button type="button" variant="outline" size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" /> 첫 번째 오염 항목 추가
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {contaminationList.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-center p-3 border rounded-lg bg-white">
                <div className="flex-1">
                  <Select
                    value={item.type}
                    onValueChange={val => onChange(idx, 'type', val)}
                  >
                    <SelectTrigger className={`${!item.type ? 'border-red-300' : ''}`}>
                      <SelectValue placeholder="오염항목 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTAMINATION_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className={`w-32 ${!item.value || item.value <= 0 ? 'border-red-300' : ''}`}
                    value={item.value || ''}
                    onChange={e => onChange(idx, 'value', parseFloat(e.target.value) || 0)}
                    placeholder="농도"
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">mg/kg</span>
                </div>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onRemove(idx)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" size="sm" onClick={onAdd}>
              <Plus className="w-4 h-4 mr-1" /> 오염 항목 추가
            </Button>
            
            {contaminationList.length > 0 && (
              <span className="text-sm text-gray-500">
                총 {contaminationList.length}개 항목
              </span>
            )}
          </div>
        </>
      )}
      
      {/* 유효성 검사 에러 메시지 */}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
      
      {hasEmptyItems && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          모든 항목의 오염물질과 농도를 입력해주세요
        </p>
      )}
      
      {hasDuplicateTypes && (
        <p className="text-sm text-yellow-600 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          중복된 오염물질이 있습니다
        </p>
      )}
    </div>
  )
} 