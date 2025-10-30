
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { FileText, Upload, Eye, Edit, Trash, Plus, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { DocumentManagement } from '@/types/agentSettings';

const mockDocuments: DocumentManagement[] = [
  {
    id: '1',
    type: 'tos',
    title: 'Terms of Service for Travel Agents',
    version: '2.1',
    effectiveDate: '2024-01-01',
    fileUrl: '/documents/tos-v2.1.pdf',
    isActive: true,
    acknowledgments: [
      { agentId: 1, acknowledgedAt: '2024-01-15T10:00:00Z', version: '2.1' },
      { agentId: 2, acknowledgedAt: '2024-01-16T14:30:00Z', version: '2.1' }
    ]
  },
  {
    id: '2',
    type: 'privacy',
    title: 'Privacy Policy',
    version: '1.3',
    effectiveDate: '2024-01-01',
    fileUrl: '/documents/privacy-v1.3.pdf',
    isActive: true,
    acknowledgments: [
      { agentId: 1, acknowledgedAt: '2024-01-15T10:05:00Z', version: '1.3' }
    ]
  }
];

const DocumentManagementTab: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentManagement[]>(mockDocuments);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDocument, setNewDocument] = useState({
    type: 'tos' as 'tos' | 'privacy' | 'contract' | 'other',
    title: '',
    version: '',
    effectiveDate: '',
    file: null as File | null
  });

  const handleAddDocument = () => {
    if (!newDocument.title || !newDocument.version || !newDocument.effectiveDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const document: DocumentManagement = {
      id: Date.now().toString(),
      type: newDocument.type,
      title: newDocument.title,
      version: newDocument.version,
      effectiveDate: newDocument.effectiveDate,
      fileUrl: `/documents/${newDocument.title.toLowerCase().replace(/\s+/g, '-')}-v${newDocument.version}.pdf`,
      isActive: true,
      acknowledgments: []
    };

    setDocuments(prev => [...prev, document]);
    setNewDocument({ type: 'tos', title: '', version: '', effectiveDate: '', file: null });
    setIsAddDialogOpen(false);
    toast.success('Document added successfully');
  };

  const handleToggleActive = (documentId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, isActive: !doc.isActive } : doc
    ));
    toast.success('Document status updated');
  };

  const getDocumentTypeLabel = (type: string) => {
    const types = {
      tos: 'Terms of Service',
      privacy: 'Privacy Policy',
      contract: 'Contract',
      other: 'Other'
    };
    return types[type as keyof typeof types] || type;
  };

  const getAcknowledgmentRate = (doc: DocumentManagement) => {
    // Mock total agents count
    const totalAgents = 4;
    const acknowledged = doc.acknowledgments.length;
    return Math.round((acknowledged / totalAgents) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Document Upload */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Document Management
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Document</DialogTitle>
                  <DialogDescription>
                    Provide document details and upload a file for agents to view.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="docType">Document Type</Label>
                    <Select value={newDocument.type} onValueChange={(value: any) => setNewDocument(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tos">Terms of Service</SelectItem>
                        <SelectItem value="privacy">Privacy Policy</SelectItem>
                        <SelectItem value="contract">Contract Template</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="title">Document Title</Label>
                    <Input
                      id="title"
                      value={newDocument.title}
                      onChange={(e) => setNewDocument(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter document title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      value={newDocument.version}
                      onChange={(e) => setNewDocument(prev => ({ ...prev, version: e.target.value }))}
                      placeholder="e.g., 1.0, 2.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="effectiveDate">Effective Date</Label>
                    <Input
                      id="effectiveDate"
                      type="date"
                      value={newDocument.effectiveDate}
                      onChange={(e) => setNewDocument(prev => ({ ...prev, effectiveDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="file">Upload Document</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setNewDocument(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddDocument}>
                      Add Document
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Acknowledgment Rate</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.title}</TableCell>
                  <TableCell>{getDocumentTypeLabel(doc.type)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">v{doc.version}</Badge>
                  </TableCell>
                  <TableCell>{new Date(doc.effectiveDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={doc.isActive ? 'default' : 'secondary'}>
                      {doc.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${getAcknowledgmentRate(doc)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm">{getAcknowledgmentRate(doc)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant={doc.isActive ? 'destructive' : 'default'} 
                        size="sm"
                        onClick={() => handleToggleActive(doc.id)}
                      >
                        {doc.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Acknowledgment Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Document Acknowledgment Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents.filter(doc => doc.isActive).map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{doc.title} v{doc.version}</h4>
                  <Badge variant="outline">{doc.acknowledgments.length} acknowledged</Badge>
                </div>
                <div className="space-y-2">
                  {doc.acknowledgments.map((ack, index) => (
                    <div key={index} className="flex justify-between text-sm text-gray-600">
                      <span>Agent ID: {ack.agentId}</span>
                      <span>Acknowledged: {new Date(ack.acknowledgedAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {doc.acknowledgments.length === 0 && (
                    <p className="text-sm text-gray-500">No acknowledgments yet</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentManagementTab;
