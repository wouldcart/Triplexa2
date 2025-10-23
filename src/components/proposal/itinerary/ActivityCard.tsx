
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Landmark, Camera, Utensils, TreePine, Waves, 
  Mountain, Building, Users, Clock, MapPin 
} from 'lucide-react';

interface ActivityCardProps {
  activity: any;
  formatCurrency: (amount: number) => string;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, formatCurrency }) => {
  const getActivityIcon = (type: string) => {
    const iconMap = {
      'sightseeing': Landmark,
      'cultural': Building,
      'adventure': Mountain,
      'nature': TreePine,
      'beach': Waves,
      'photography': Camera,
      'dining': Utensils,
      'group': Users
    };
    
    const IconComponent = iconMap[type?.toLowerCase() as keyof typeof iconMap] || Landmark;
    return IconComponent;
  };

  const getActivityImage = (type: string, name: string) => {
    // Map activity types to appropriate Unsplash images
    const imageMap = {
      'temple': 'photo-1473177104440-ffee2f376098', // cathedral interior
      'mountain': 'photo-1501854140801-50d01698950b', // mountain view
      'nature': 'photo-1500673922987-e212871fec22', // yellow lights between trees
      'cultural': 'photo-1493397212122-2b85dda8106b', // building with wavy lines
      'wildlife': 'photo-1466721591366-2d5fba72006d', // antelope and zebra
      'default': 'photo-1472396961693-142e6e269027' // deer and mountain
    };

    // Determine image based on activity name/type
    let imageKey = 'default';
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('temple') || lowerName.includes('palace')) imageKey = 'temple';
    else if (lowerName.includes('mountain') || lowerName.includes('hill')) imageKey = 'mountain';
    else if (lowerName.includes('park') || lowerName.includes('garden')) imageKey = 'nature';
    else if (lowerName.includes('museum') || lowerName.includes('cultural')) imageKey = 'cultural';
    else if (lowerName.includes('safari') || lowerName.includes('wildlife')) imageKey = 'wildlife';

    return `https://images.unsplash.com/${imageMap[imageKey]}?w=400&h=200&fit=crop`;
  };

  const getActivityColor = (type: string) => {
    const colorMap = {
      'sightseeing': 'from-blue-500 to-blue-600',
      'cultural': 'from-indigo-500 to-indigo-600',
      'adventure': 'from-green-500 to-green-600',
      'nature': 'from-emerald-500 to-emerald-600',
      'beach': 'from-cyan-500 to-cyan-600',
      'photography': 'from-purple-500 to-purple-600',
      'dining': 'from-orange-500 to-orange-600',
      'default': 'from-gray-500 to-gray-600'
    };
    
    return colorMap[type?.toLowerCase() as keyof typeof colorMap] || colorMap.default;
  };

  const IconComponent = getActivityIcon(activity.type);
  const bgGradient = getActivityColor(activity.type);
  const activityImage = getActivityImage(activity.type, activity.name);

  return (
    <div className="relative overflow-hidden rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Activity Image */}
      <div className="relative h-32 overflow-hidden">
        <img 
          src={activityImage}
          alt={activity.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to gradient background if image fails
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className={`absolute inset-0 bg-gradient-to-r ${bgGradient} opacity-20`} />
        
        {/* Activity Type Badge */}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-white/90 text-gray-800 backdrop-blur-sm">
            <IconComponent className="h-3 w-3 mr-1" />
            {activity.type || 'Activity'}
          </Badge>
        </div>
      </div>

      {/* Activity Details */}
      <div className="p-4 space-y-3">
        <div>
          <h4 className="font-semibold text-gray-900 line-clamp-2">{activity.name}</h4>
          {activity.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{activity.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {activity.duration && (
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{activity.duration}</span>
              </div>
            )}
            {(activity.startTime && activity.endTime) && (
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{activity.startTime} - {activity.endTime}</span>
              </div>
            )}
          </div>
          <div className="font-semibold text-gray-900">
            {formatCurrency(activity.price || activity.cost || 0)}
          </div>
        </div>

        {activity.inclusions && activity.inclusions.length > 0 && (
          <div className="text-xs text-gray-500">
            <span className="font-medium">Includes:</span> {activity.inclusions.slice(0, 2).join(', ')}
            {activity.inclusions.length > 2 && ` +${activity.inclusions.length - 2} more`}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityCard;
