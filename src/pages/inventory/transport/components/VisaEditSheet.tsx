
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetContent, SheetClose } from "@/components/ui/sheet";
import { Check, Plus, Trash2, FileText } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Visa, VisaDocument } from '../types/visaTypes';

interface VisaEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  visa: Visa | null;
  onSave: (updatedVisa: Visa) => void;
  countries: string[];
  visaTypes: string[];
}

const VisaEditSheet: React.FC<VisaEditSheetProps> = ({
  isOpen,
  onClose,
  visa,
  onSave,
  countries,
  visaTypes
}) => {
  const { toast } = useToast();
  const [editedVisa, setEditedVisa] = useState<Visa | null>(visa);
  const [newDocument, setNewDocument] = useState<Omit<VisaDocument, 'id'>>({
    name: '',
    description: '',
    required: true,
    format: 'PDF'
  });

  // Update local state when visa prop changes
  React.useEffect(() => {
    setEditedVisa(visa);
  }, [visa]);

  if (!editedVisa) {
    return null;
  }

  const handleVisaChange = (field: string, value: any) => {
    setEditedVisa({
      ...editedVisa,
      [field]: value
    });
  };

  const handleNewDocumentChange = (field: string, value: any) => {
    setNewDocument({
      ...newDocument,
      [field]: value
    });
  };

  const handleAddDocument = () => {
    if (newDocument.name.trim() === '') {
      toast({
        title: "Error",
        description: "Document name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    const newDocId = `DOC${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`;
    
    setEditedVisa({
      ...editedVisa,
      documents: [
        ...editedVisa.documents,
        {
          id: newDocId,
          ...newDocument
        }
      ]
    });
    
    // Reset document form
    setNewDocument({
      name: '',
      description: '',
      required: true,
      format: 'PDF'
    });
    
    toast({
      title: "Document Added",
      description: `${newDocument.name} added to the visa requirements.`
    });
  };

  const handleRemoveDocument = (docIndex: number) => {
    const updatedDocuments = [...editedVisa.documents];
    updatedDocuments.splice(docIndex, 1);
    
    setEditedVisa({
      ...editedVisa,
      documents: updatedDocuments
    });
  };

  const handleSubmit = () => {
    // Validate form
    if (
      !editedVisa.country ||
      !editedVisa.visaType ||
      !editedVisa.processingTime ||
      !editedVisa.validity ||
      editedVisa.price <= 0
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }
    
    // Validate rush fields if rush is available
    if (editedVisa.isRushAvailable) {
      if (!editedVisa.rushProcessingTime || !editedVisa.rushPrice || editedVisa.rushPrice <= 0) {
        toast({
          title: "Validation Error",
          description: "Please fill rush processing details",
          variant: "destructive"
        });
        return;
      }
    }
    
    onSave(editedVisa);
    onClose();
    
    toast({
      title: "Visa Updated",
      description: `${editedVisa.country} - ${editedVisa.visaType} has been updated successfully.`
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Visa</SheetTitle>
          <SheetDescription>
            Update visa entry with all the required details and documents.
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 py-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visa-country">Country</Label>
                <Select 
                  value={editedVisa.country} 
                  onValueChange={(value) => handleVisaChange('country', value)}
                >
                  <SelectTrigger id="visa-country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="visa-type">Visa Type</Label>
                <Select
                  value={editedVisa.visaType}
                  onValueChange={(value) => handleVisaChange('visaType', value)}
                >
                  <SelectTrigger id="visa-type">
                    <SelectValue placeholder="Select visa type" />
                  </SelectTrigger>
                  <SelectContent>
                    {visaTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="processing-time">Processing Time</Label>
                <Input 
                  id="processing-time"
                  placeholder="e.g. 5-7 working days"
                  value={editedVisa.processingTime}
                  onChange={(e) => handleVisaChange('processingTime', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="validity">Validity</Label>
                <Input 
                  id="validity"
                  placeholder="e.g. 3 months"
                  value={editedVisa.validity}
                  onChange={(e) => handleVisaChange('validity', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input 
                  id="price"
                  type="number"
                  placeholder="Enter price in INR"
                  value={editedVisa.price}
                  onChange={(e) => handleVisaChange('price', Number(e.target.value))}
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                  id="rush-available"
                  checked={editedVisa.isRushAvailable}
                  onCheckedChange={(checked) => handleVisaChange('isRushAvailable', checked)}
                />
                <Label htmlFor="rush-available">Rush processing available</Label>
              </div>
              
              {editedVisa.isRushAvailable && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="rush-processing-time">Rush Processing Time</Label>
                    <Input 
                      id="rush-processing-time"
                      placeholder="e.g. 24-48 hours"
                      value={editedVisa.rushProcessingTime || ''}
                      onChange={(e) => handleVisaChange('rushProcessingTime', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rush-price">Rush Price (₹)</Label>
                    <Input 
                      id="rush-price"
                      type="number"
                      placeholder="Enter rush price in INR"
                      value={editedVisa.rushPrice || ''}
                      onChange={(e) => handleVisaChange('rushPrice', Number(e.target.value))}
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea 
                  id="requirements"
                  placeholder="Enter general requirements for this visa"
                  value={editedVisa.requirements}
                  onChange={(e) => handleVisaChange('requirements', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visa-status">Status</Label>
                <Select 
                  value={editedVisa.status} 
                  onValueChange={(value: 'active' | 'disabled') => handleVisaChange('status', value)}
                >
                  <SelectTrigger id="visa-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Documents Required</h3>
            
            {/* Document list */}
            {editedVisa.documents.length > 0 ? (
              <div className="space-y-3">
                {editedVisa.documents.map((doc, index) => (
                  <div key={doc.id} className="flex items-start justify-between p-3 border rounded-md bg-gray-50 dark:bg-gray-800/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-gray-500" />
                        <span className="font-medium text-sm">{doc.name}</span>
                        {doc.required && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{doc.description}</p>
                      <p className="text-xs text-gray-500">Format: {doc.format}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500"
                      onClick={() => handleRemoveDocument(index)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No documents added yet.</p>
            )}
            
            {/* Add new document section */}
            <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800/50 space-y-3">
              <h4 className="font-medium text-sm">Add New Document</h4>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="doc-name">Document Name</Label>
                  <Input 
                    id="doc-name"
                    placeholder="e.g. Passport Copy"
                    value={newDocument.name}
                    onChange={(e) => handleNewDocumentChange('name', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="doc-description">Description</Label>
                  <Input 
                    id="doc-description"
                    placeholder="e.g. Clear scan of passport front page"
                    value={newDocument.description}
                    onChange={(e) => handleNewDocumentChange('description', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="doc-format">Format</Label>
                  <Select 
                    value={newDocument.format}
                    onValueChange={(value) => handleNewDocumentChange('format', value)}
                  >
                    <SelectTrigger id="doc-format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="JPEG">JPEG</SelectItem>
                      <SelectItem value="PNG">PNG</SelectItem>
                      <SelectItem value="PDF/JPEG">PDF/JPEG</SelectItem>
                      <SelectItem value="Any">Any Format</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="doc-required"
                    checked={newDocument.required}
                    onCheckedChange={(checked) => handleNewDocumentChange('required', checked)}
                  />
                  <Label htmlFor="doc-required">Document is required</Label>
                </div>
                
                <Button
                  className="w-full flex items-center gap-2"
                  onClick={handleAddDocument}
                >
                  <Plus size={16} />
                  Add Document
                </Button>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-end space-x-2">
              <SheetClose asChild>
                <Button variant="outline">Cancel</Button>
              </SheetClose>
              <Button onClick={handleSubmit} className="flex items-center gap-2">
                <Check size={16} />
                Update Visa
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default VisaEditSheet;
