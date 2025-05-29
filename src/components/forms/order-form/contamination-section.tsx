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
import { Plus, Trash2 } from "lucide-react"
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
  return (
    <div className="space-y-2">
      <Label>오염 정보 *</Label>
      {contaminationList.map((item, idx) => (
        <div key={idx} className="flex gap-2 items-center mb-2">
          <Select
            value={item.type}
            onValueChange={val => onChange(idx, 'type', val)}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="오염항목 선택" />
            </SelectTrigger>
            <SelectContent>
              {CONTAMINATION_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={0}
            className="w-32"
            value={item.value || ''}
            onChange={e => onChange(idx, 'value', e.target.value)}
            placeholder="농도"
          />
          <span className="text-sm text-gray-500">mg/kg</span>
          <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(idx)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus className="w-4 h-4 mr-1" /> 오염 항목 추가
      </Button>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
} 