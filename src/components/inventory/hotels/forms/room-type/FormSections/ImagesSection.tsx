
import React, { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash, Check, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ImagesSection = () => {
  const form = useFormContext();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'images',
  });

  // Add a new image field
  const handleAddImage = () => {
    append({ id: `img-${Date.now()}`, url: '' });
  };

  // Set primary image
  const handleSetPrimary = (index: number) => {
    const newImages = form.getValues('images').map((img: any, i: number) => ({
      ...img,
      isPrimary: i === index
    }));
    form.setValue('images', newImages);
  };

  // Handle file upload
  const handleFileUpload = (index: number, file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        form.setValue(`images.${index}.url`, result);
        form.setValue(`images.${index}.file`, file);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle drag and drop
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const images = form.getValues('images');
      const draggedItem = images[draggedIndex];
      const newImages = [...images];
      
      // Remove dragged item
      newImages.splice(draggedIndex, 1);
      // Insert at new position
      newImages.splice(dropIndex, 0, draggedItem);
      
      form.setValue('images', newImages);
    }
    setDraggedIndex(null);
  };

  return (
    <div className="md:col-span-2">
      <div className="mb-4">
        <FormLabel>Room Images*</FormLabel>
        <FormDescription>
          Add images of the room. You can drag and drop to reorder. The first image will be used as the primary image.
        </FormDescription>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className={`border rounded-lg p-4 transition-all duration-200 ${
              draggedIndex === index ? 'opacity-50 scale-95' : 'opacity-100'
            }`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            <div className="flex items-start gap-4">
              {/* Image Preview */}
              <div className="flex-shrink-0">
                {form.watch(`images.${index}.url`) ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={form.watch(`images.${index}.url`)}
                      alt={`Room image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 right-1">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          form.setValue(`images.${index}.url`, '');
                          form.setValue(`images.${index}.file`, null);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Image Upload/URL Section */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={index === 0 ? "default" : "secondary"}>
                    {index === 0 ? "Primary" : `Image ${index + 1}`}
                  </Badge>
                  {form.watch(`images.${index}.isPrimary`) && (
                    <Badge variant="outline">
                      <Check className="h-3 w-3 mr-1" />
                      Primary
                    </Badge>
                  )}
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <FormLabel className="text-sm">Upload Image</FormLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(index, file);
                        }
                      }}
                      className="file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`file-input-${index}`)?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Browse
                    </Button>
                  </div>
                </div>

                {/* Or URL Input */}
                <div className="space-y-2">
                  <FormLabel className="text-sm">Or Enter Image URL</FormLabel>
                  <FormField
                    control={form.control}
                    name={`images.${index}.url`}
                    render={({ field: urlField }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/image.jpg" 
                            {...urlField}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Alt Text */}
                <div className="space-y-2">
                  <FormLabel className="text-sm">Alt Text (Optional)</FormLabel>
                  <FormField
                    control={form.control}
                    name={`images.${index}.alt`}
                    render={({ field: altField }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="Description of the image" 
                            {...altField}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                {index > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetPrimary(index)}
                  >
                    {form.getValues(`images.${index}.isPrimary`) ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : null}
                    Set Primary
                  </Button>
                )}
                {index > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between items-center">
        <Button
          type="button"
          variant="outline"
          onClick={handleAddImage}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Another Image
        </Button>
        
        <p className="text-sm text-gray-500">
          {fields.length} image{fields.length !== 1 ? 's' : ''} added
        </p>
      </div>
    </div>
  );
};

export default ImagesSection;
