import React from 'react';

const AutoSaveDemo: React.FC = () => {
  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Enhanced Auto-Save Features</h3>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📝 Smart Timing</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Regular inputs: Auto-save after 2 seconds</li>
            <li>• Textarea content: Auto-save after 15 seconds</li>
            <li>• Gives you time to type complete thoughts</li>
          </ul>
        </div>
        
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">🎯 Text Selection Tracking</h4>
          <ul className="text-sm text-green-800 dark:text-green-300 space-y-1">
            <li>• Tracks selected text in real-time</li>
            <li>• Shows character count of selection</li>
            <li>• Perfect for editing and reviewing content</li>
          </ul>
        </div>
        
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">⚡ Real-time Feedback</h4>
          <ul className="text-sm text-purple-800 dark:text-purple-300 space-y-1">
            <li>• Typing indicators show when you're active</li>
            <li>• Word and character counters</li>
            <li>• Clear save status indicators</li>
          </ul>
        </div>
        
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">💡 Pro Tips</h4>
          <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
            <li>• Type freely - auto-save won't interrupt your flow</li>
            <li>• Select text to see selection details</li>
            <li>• Add unlimited additional details</li>
            <li>• All changes are automatically preserved</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AutoSaveDemo;