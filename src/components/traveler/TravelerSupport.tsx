import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Phone, Mail, Clock, Send, HelpCircle, FileText, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const TravelerSupport: React.FC = () => {
  const [supportForm, setSupportForm] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    message: '',
    email: '',
    phone: ''
  });

  const supportCategories = [
    { value: 'booking', label: 'Booking Issues' },
    { value: 'itinerary', label: 'Itinerary Changes' },
    { value: 'payment', label: 'Payment & Billing' },
    { value: 'travel', label: 'Travel Information' },
    { value: 'emergency', label: 'Emergency Support' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  const faqs = [
    {
      question: "How can I view my trip itinerary?",
      answer: "You can view your complete itinerary by clicking on 'My Itinerary' from your dashboard or the main navigation menu."
    },
    {
      question: "What should I do if my flight is delayed?",
      answer: "Contact our support team immediately. We'll help rearrange your accommodation and activities to minimize disruption to your trip."
    },
    {
      question: "Can I make changes to my booking?",
      answer: "Yes, you can request changes through your dashboard or by contacting our support team. Additional charges may apply depending on the changes."
    },
    {
      question: "How do I contact my travel guide?",
      answer: "Your guide's contact information is available in your itinerary. You can also reach them through our support team if needed."
    },
    {
      question: "What if I need emergency assistance during my trip?",
      answer: "Call our 24/7 emergency hotline at +1-800-TRAVEL-HELP. For immediate emergencies, contact local emergency services first."
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supportForm.subject || !supportForm.category || !supportForm.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    console.log('Support request submitted:', supportForm);
    toast({
      title: "Support Request Submitted",
      description: "We'll get back to you within 24 hours.",
    });

    // Reset form
    setSupportForm({
      subject: '',
      category: '',
      priority: 'medium',
      message: '',
      email: '',
      phone: ''
    });
  };

  const handleFormChange = (field: string, value: string) => {
    setSupportForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700">
        <div className="px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Support Center
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Get help with your travel experience
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Contact Us</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <Phone className="h-8 w-8 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Phone Support</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">+1 (800) 123-TRAVEL</p>
                    <p className="text-xs text-gray-500">Available 24/7</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <Mail className="h-8 w-8 text-green-600" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Email Support</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">support@travel.com</p>
                    <p className="text-xs text-gray-500">Response within 24h</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <Clock className="h-8 w-8 text-purple-600" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Emergency Line</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">+1 (800) EMERGENCY</p>
                    <p className="text-xs text-gray-500">24/7 Emergency only</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <MessageCircle className="h-8 w-8 text-orange-600" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Live Chat</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Chat with agent</p>
                    <p className="text-xs text-gray-500">Mon-Fri 9AM-6PM</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Office Hours</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                  <p>Saturday: 10:00 AM - 4:00 PM EST</p>
                  <p>Sunday: 12:00 PM - 4:00 PM EST</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Emergency support available 24/7
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Request Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="h-5 w-5" />
                <span>Submit Support Request</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={supportForm.subject}
                    onChange={(e) => handleFormChange('subject', e.target.value)}
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={supportForm.category}
                      onValueChange={(value) => handleFormChange('category', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {supportCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={supportForm.priority}
                      onValueChange={(value) => handleFormChange('priority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            <div className="flex items-center space-x-2">
                              <Badge className={priority.color}>
                                {priority.label}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={supportForm.message}
                    onChange={(e) => handleFormChange('message', e.target.value)}
                    placeholder="Please describe your issue in detail..."
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Contact Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={supportForm.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={supportForm.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Support Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HelpCircle className="h-5 w-5" />
              <span>Frequently Asked Questions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-start space-x-2">
                    <FileText className="h-4 w-4 mt-0.5 text-blue-500" />
                    <span>{faq.question}</span>
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Notice */}
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/10">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900 dark:text-red-200">Emergency Support</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  For immediate emergencies during your trip, call our 24/7 emergency hotline at{' '}
                  <span className="font-semibold">+1 (800) EMERGENCY</span>. 
                  For life-threatening situations, contact local emergency services first.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TravelerSupport;