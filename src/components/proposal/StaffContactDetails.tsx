
import React from 'react';
import { Phone, Mail, MapPin, Globe, MessageCircle } from 'lucide-react';

interface StaffContact {
  name: string;
  designation: string;
  phone: string;
  email: string;
  whatsapp?: string;
}

interface StaffContactDetailsProps {
  primaryContact: StaffContact;
  companyDetails: {
    name: string;
    address: string;
    website: string;
    phone: string;
    email: string;
  };
}

export const StaffContactDetails: React.FC<StaffContactDetailsProps> = ({
  primaryContact,
  companyDetails
}) => {
  return (
    <div className="bg-gray-900 text-white p-8">
      <div className="max-width-800px mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Primary Contact */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-blue-400">Your Travel Consultant</h3>
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-lg">{primaryContact.name}</h4>
              <p className="text-gray-300 text-sm">{primaryContact.designation}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-400" />
                <a href={`tel:${primaryContact.phone}`} className="text-green-400 hover:text-green-300">
                  {primaryContact.phone}
                </a>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-400" />
                <a href={`mailto:${primaryContact.email}`} className="text-blue-400 hover:text-blue-300">
                  {primaryContact.email}
                </a>
              </div>
              
              {primaryContact.whatsapp && (
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-400" />
                  <a href={`https://wa.me/${primaryContact.whatsapp.replace(/[^\d]/g, '')}`} className="text-green-400 hover:text-green-300">
                    WhatsApp: {primaryContact.whatsapp}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Company Details */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-blue-400">Company Information</h3>
          <div className="space-y-3">
            <h4 className="font-semibold text-lg">{companyDetails.name}</h4>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-orange-400 mt-0.5" />
                <span className="text-gray-300 text-sm">{companyDetails.address}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-400" />
                <a href={`tel:${companyDetails.phone}`} className="text-green-400 hover:text-green-300">
                  {companyDetails.phone}
                </a>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-400" />
                <a href={`mailto:${companyDetails.email}`} className="text-blue-400 hover:text-blue-300">
                  {companyDetails.email}
                </a>
              </div>
              
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-purple-400" />
                <a href={companyDetails.website} className="text-purple-400 hover:text-purple-300" target="_blank" rel="noopener noreferrer">
                  {companyDetails.website}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-700 mt-6 pt-6 text-center">
        <p className="text-sm text-gray-400">
          Thank you for choosing our services. We're committed to making your travel experience exceptional!
        </p>
      </div>
    </div>
  );
};
