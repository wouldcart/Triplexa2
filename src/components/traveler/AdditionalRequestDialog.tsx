
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdditionalRequestDialogProps {
  tripId: string;
  activityId?: string;
  trigger: React.ReactNode;
}

const AdditionalRequestDialog: React.FC<AdditionalRequestDialogProps> = ({
  tripId,
  activityId,
  trigger
}) => {
  const [open, setOpen] = useState(false);
  const [requestType, setRequestType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestType || !title || !description) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Here you would typically send the request to your backend
    console.log('Submitting request:', {
      tripId,
      activityId,
      requestType,
      title,
      description
    });

    toast.success('Request submitted successfully');
    setOpen(false);
    setRequestType('');
    setTitle('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[90vh] overflow-y-auto' : 'max-w-md'}`}>
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Additional Request</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="requestType" className="text-sm">Request Type</Label>
            <Select value={requestType} onValueChange={setRequestType}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select request type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="addon">Add-on Service</SelectItem>
                <SelectItem value="change">Change Request</SelectItem>
                <SelectItem value="extra-service">Extra Service</SelectItem>
                <SelectItem value="cancellation">Cancellation</SelectItem>
                <SelectItem value="update">Update</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title" className="text-sm">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of your request"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed information about your request"
              className="mt-1 min-h-[100px]"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              Submit Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdditionalRequestDialog;
