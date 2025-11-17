
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FileText, Plus, X, Edit2, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import EnhancedTextarea from '../../components/EnhancedTextarea';

interface DescriptionSectionProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onAddDetail?: (detail: { title: string; content: string }) => void;
  onRemoveDetail?: (index: number) => void;
  onEditDetail?: (index: number, detail: { title: string; content: string }) => void;
  additionalDetails?: { title: string; content: string }[];
}

const DescriptionSection: React.FC<DescriptionSectionProps> = ({
  formData,
  handleInputChange,
  onAddDetail,
  onRemoveDetail,
  onEditDetail,
  additionalDetails = [],
}) => {
  const [showAddDetail, setShowAddDetail] = useState(false);
  const [newDetailTitle, setNewDetailTitle] = useState('');
  const [newDetailContent, setNewDetailContent] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const handleAddDetail = () => {
    if (newDetailTitle.trim() && newDetailContent.trim()) {
      onAddDetail?.({
        title: newDetailTitle.trim(),
        content: newDetailContent.trim(),
      });
      setNewDetailTitle('');
      setNewDetailContent('');
      setShowAddDetail(false);
    }
  };

  const handleCancelAddDetail = () => {
    setNewDetailTitle('');
    setNewDetailContent('');
    setShowAddDetail(false);
  };

  const handleEditDetail = (index: number) => {
    setEditingIndex(index);
    setEditTitle(additionalDetails[index].title);
    setEditContent(additionalDetails[index].content);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editTitle.trim() && editContent.trim()) {
      onEditDetail?.(editingIndex, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });
      setEditingIndex(null);
      setEditTitle('');
      setEditContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditTitle('');
    setEditContent('');
  };
  return (
    <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold">Description & Details</h3>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-6">
        {/* Main Description */}
        <div className="space-y-2">
          <Label className="block text-base font-medium">Hotel Description</Label>
          <EnhancedTextarea
            name="description"
            value={formData.description || ''}
            onChange={handleInputChange}
            placeholder="Enter a detailed description of the hotel, including its features, surroundings, and unique selling points."
            className="min-h-[150px] resize-y border-gray-300 dark:border-gray-600 rounded-md"
            rows={6}
            typingDelay={2000} // 2 second typing delay before showing typing ended
            onSelectionChange={(selection) => {
              console.log('Text selection:', selection);
            }}
            onTypingStart={() => {
              console.log('User started typing...');
            }}
            onTypingEnd={() => {
              console.log('User stopped typing');
            }}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
            Provide a comprehensive description of the hotel to help guests understand what makes it special. Include information about location highlights, services offered, and any notable amenities.
          </p>
        </div>

        {/* Additional Details */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Additional Details</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddDetail(true)}
              className="gap-1"
            >
              <Plus className="h-3 w-3" />
              Add Detail
            </Button>
          </div>

          {/* Existing Additional Details */}
          {additionalDetails.length > 0 && (
            <div className="space-y-3">
              {additionalDetails.map((detail, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  {editingIndex === index ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`edit-title-${index}`} className="text-sm font-medium">Title</Label>
                        <Input
                          id={`edit-title-${index}`}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Detail title"
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`edit-content-${index}`} className="text-sm font-medium">Content</Label>
                        <EnhancedTextarea
                          id={`edit-content-${index}`}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          placeholder="Detail content"
                          className="min-h-[80px] text-sm"
                          rows={3}
                          typingDelay={1500}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={!editTitle.trim() || !editContent.trim()}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">{detail.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{detail.content}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditDetail(index)}
                          className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveDetail?.(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add New Detail Form */}
          {showAddDetail && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="detail-title" className="text-sm font-medium">Detail Title</Label>
                  <Input
                    id="detail-title"
                    value={newDetailTitle}
                    onChange={(e) => setNewDetailTitle(e.target.value)}
                    placeholder="e.g., Nearby Attractions, Special Services"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="detail-content" className="text-sm font-medium">Detail Content</Label>
                  <EnhancedTextarea
                    id="detail-content"
                    value={newDetailContent}
                    onChange={(e) => setNewDetailContent(e.target.value)}
                    placeholder="Provide detailed information about this aspect of the hotel."
                    className="min-h-[80px] text-sm"
                    rows={4}
                    typingDelay={1500}
                    onSelectionChange={(selection) => {
                      console.log('Detail text selection:', selection);
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddDetail}
                    disabled={!newDetailTitle.trim() || !newDetailContent.trim()}
                  >
                    Add Detail
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelAddDetail}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DescriptionSection;
