import React, { useState } from 'react';
import { useTravelerData } from '@/hooks/useTravelerData';
import { TravelerTrip } from '@/types/travelerTypes';
import { Calendar, MapPin, Tag, Star, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const TripHistory: React.FC = () => {
  const { tripHistory } = useTravelerData();
  const [selectedTrip, setSelectedTrip] = useState<TravelerTrip | null>(null);
  const [feedbackTrip, setFeedbackTrip] = useState<TravelerTrip | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'business':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'leisure':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'mixed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const submitFeedback = () => {
    console.log('Feedback submitted:', { tripId: feedbackTrip?.id, rating, feedback });
    setFeedbackTrip(null);
    setRating(0);
    setFeedback('');
  };

  const StarRating = ({ rating, onRatingChange }: { rating: number; onRatingChange: (rating: number) => void }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onRatingChange(star)}
            className={cn(
              "w-6 h-6 transition-colors",
              star <= rating ? "text-yellow-400" : "text-gray-300"
            )}
          >
            <Star className="w-full h-full fill-current" />
          </button>
        ))}
      </div>
    );
  };

  if (tripHistory.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 mb-6">
            <div className="px-6 py-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Trip History
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View your past adventures and memories
              </p>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🌍</div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Trip History
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                You haven't completed any trips yet. Start your first adventure!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700">
        <div className="px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Trip History
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {tripHistory.length} completed trips
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tripHistory.map((trip) => (
            <Card key={trip.id} className="hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={trip.imageUrl || '/placeholder.svg'}
                  alt={trip.destination}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    Completed
                  </Badge>
                </div>
              </div>

              <CardHeader>
                <CardTitle className="text-lg">{trip.destination}</CardTitle>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{trip.cities.join(' • ')}</span>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{formatDate(trip.startDate)}</span>
                    </div>
                    <span className="text-gray-500">{trip.duration} days</span>
                  </div>

                  {trip.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {trip.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {trip.tags.map((tag) => (
                      <span
                        key={tag}
                        className={cn(
                          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                          getTagColor(tag)
                        )}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedTrip(trip)}
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{selectedTrip?.destination}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <img
                            src={selectedTrip?.imageUrl || '/placeholder.svg'}
                            alt={selectedTrip?.destination}
                            className="w-full h-64 object-cover rounded-lg"
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium">Country</Label>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTrip?.country}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Cities Visited</Label>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTrip?.cities.join(', ')}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Duration</Label>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTrip?.duration} days</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Trip Type</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedTrip?.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className={cn(
                                      "inline-flex items-center px-2 py-1 rounded-full text-xs",
                                      getTagColor(tag)
                                    )}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          {selectedTrip?.description && (
                            <div>
                              <Label className="text-sm font-medium">Description</Label>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {selectedTrip.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFeedbackTrip(trip)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Rate Your Trip</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">
                              How was your trip to {feedbackTrip?.destination}?
                            </Label>
                            <StarRating rating={rating} onRatingChange={setRating} />
                          </div>
                          <div>
                            <Label htmlFor="feedback" className="text-sm font-medium">
                              Share your experience (optional)
                            </Label>
                            <Textarea
                              id="feedback"
                              placeholder="Tell us about your trip highlights, recommendations, or areas for improvement..."
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                              className="mt-1"
                              rows={4}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setFeedbackTrip(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={submitFeedback}
                              disabled={rating === 0}
                            >
                              Submit Review
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TripHistory;