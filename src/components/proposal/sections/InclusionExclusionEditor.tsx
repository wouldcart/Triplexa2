
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Edit3, Check } from 'lucide-react';

interface InclusionExclusionData {
  inclusions: string[];
  exclusions: string[];
}

interface InclusionExclusionEditorProps {
  data: InclusionExclusionData;
  onChange: (data: InclusionExclusionData) => void;
  readonly?: boolean;
}

const InclusionExclusionEditor: React.FC<InclusionExclusionEditorProps> = ({
  data,
  onChange,
  readonly = false
}) => {
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [editingIndex, setEditingIndex] = useState<{ type: 'inclusion' | 'exclusion'; index: number } | null>(null);
  const [editValue, setEditValue] = useState('');

  const addInclusion = () => {
    if (newInclusion.trim()) {
      onChange({
        ...data,
        inclusions: [...data.inclusions, newInclusion.trim()]
      });
      setNewInclusion('');
    }
  };

  const addExclusion = () => {
    if (newExclusion.trim()) {
      onChange({
        ...data,
        exclusions: [...data.exclusions, newExclusion.trim()]
      });
      setNewExclusion('');
    }
  };

  const removeInclusion = (index: number) => {
    onChange({
      ...data,
      inclusions: data.inclusions.filter((_, i) => i !== index)
    });
  };

  const removeExclusion = (index: number) => {
    onChange({
      ...data,
      exclusions: data.exclusions.filter((_, i) => i !== index)
    });
  };

  const startEdit = (type: 'inclusion' | 'exclusion', index: number, value: string) => {
    setEditingIndex({ type, index });
    setEditValue(value);
  };

  const saveEdit = () => {
    if (!editingIndex) return;
    
    if (editingIndex.type === 'inclusion') {
      const newInclusions = [...data.inclusions];
      newInclusions[editingIndex.index] = editValue;
      onChange({ ...data, inclusions: newInclusions });
    } else {
      const newExclusions = [...data.exclusions];
      newExclusions[editingIndex.index] = editValue;
      onChange({ ...data, exclusions: newExclusions });
    }
    
    setEditingIndex(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inclusions & Exclusions</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="inclusions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inclusions">
              Inclusions ({data.inclusions.length})
            </TabsTrigger>
            <TabsTrigger value="exclusions">
              Exclusions ({data.exclusions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inclusions" className="space-y-4">
            {!readonly && (
              <div className="flex gap-2">
                <Input
                  placeholder="Add new inclusion..."
                  value={newInclusion}
                  onChange={(e) => setNewInclusion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addInclusion()}
                />
                <Button onClick={addInclusion} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="space-y-2">
              {data.inclusions.map((inclusion, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  {editingIndex?.type === 'inclusion' && editingIndex.index === index ? (
                    <>
                      <Textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1"
                        rows={2}
                      />
                      <div className="flex flex-col gap-1">
                        <Button size="sm" onClick={saveEdit}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <Badge variant="secondary" className="mr-2 bg-green-100 text-green-800">
                          ✓
                        </Badge>
                        {inclusion}
                      </div>
                      {!readonly && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit('inclusion', index, inclusion)}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeInclusion(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="exclusions" className="space-y-4">
            {!readonly && (
              <div className="flex gap-2">
                <Input
                  placeholder="Add new exclusion..."
                  value={newExclusion}
                  onChange={(e) => setNewExclusion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addExclusion()}
                />
                <Button onClick={addExclusion} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="space-y-2">
              {data.exclusions.map((exclusion, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  {editingIndex?.type === 'exclusion' && editingIndex.index === index ? (
                    <>
                      <Textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1"
                        rows={2}
                      />
                      <div className="flex flex-col gap-1">
                        <Button size="sm" onClick={saveEdit}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <Badge variant="secondary" className="mr-2 bg-red-100 text-red-800">
                          ✗
                        </Badge>
                        {exclusion}
                      </div>
                      {!readonly && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit('exclusion', index, exclusion)}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeExclusion(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default InclusionExclusionEditor;
