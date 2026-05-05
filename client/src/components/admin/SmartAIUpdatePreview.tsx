import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface SmartAIUpdatePreviewProps {
  operation: 'create' | 'update';
  confidence: number;
  matched_entry?: any;
  changes?: Record<string, { old: any; new: any }>;
  entries?: any[];
  explanation: string;
  sectionType: string;
  onConfirm: () => void;
  onRegenerate: () => void;
  onCancel: () => void;
  renderPreview?: (entry: any) => React.ReactNode;
}

export function SmartAIUpdatePreview({
  operation,
  confidence,
  matched_entry,
  changes = {},
  entries = [],
  explanation,
  sectionType,
  onConfirm,
  onRegenerate,
  onCancel,
  renderPreview,
}: SmartAIUpdatePreviewProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const isUpdate = operation === 'update';
  const changesCount = Object.keys(changes).length;

  // Helper to format field names nicely
  const formatFieldName = (fieldName: string) => {
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper to render value
  const renderValue = (value: any) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 italic">Empty</span>;
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div className="space-y-4">
      {/* Header with operation type and confidence */}
      <div className={`flex items-center justify-between p-3 rounded-md border-2 ${
        isUpdate 
          ? 'bg-blue-50 border-blue-300' 
          : 'bg-green-50 border-green-300'
      }`}>
        <div className="flex items-center gap-3">
          {isUpdate ? (
            <AlertCircle className="h-5 w-5 text-blue-600" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${
                isUpdate ? 'text-blue-900' : 'text-green-900'
              }`}>
                {isUpdate ? 'UPDATE Operation Detected' : 'CREATE Operation Detected'}
              </span>
              <Badge variant={confidence >= 85 ? 'default' : 'secondary'}>
                {confidence}% confident
              </Badge>
            </div>
            <p className={`text-sm mt-1 ${
              isUpdate ? 'text-blue-700' : 'text-green-700'
            }`}>
              {explanation}
            </p>
          </div>
        </div>
      </div>

      {/* UPDATE Preview - Show changes with before/after */}
      {isUpdate && matched_entry && (
        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Changes Preview ({changesCount} field{changesCount > 1 ? 's' : ''} to update)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Show matched entry info */}
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Matched Entry:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {/* Display the value object fields for college_settings or direct fields for other tables */}
                {matched_entry.value ? (
                  // For college_settings with JSONB value field
                  Object.entries(matched_entry.value)
                    .filter(([key]) => key === 'title' || key === 'content' || key === 'category')
                    .map(([key, value]) => (
                      <div key={key} className={key === 'content' ? 'col-span-2' : ''}>
                        <span className="font-medium text-gray-600">{formatFieldName(key)}:</span>{' '}
                        <span className="text-gray-900">{renderValue(value)}</span>
                      </div>
                    ))
                ) : (
                  // For other tables with direct fields
                  Object.entries(matched_entry)
                    .filter(([key]) => !key.includes('id') && !key.includes('created') && !key.includes('updated') && !key.includes('key'))
                    .slice(0, 4)
                    .map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium text-gray-600">{formatFieldName(key)}:</span>{' '}
                        <span className="text-gray-900">{renderValue(value)}</span>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Show changes with before/after comparison */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">
                Changes to Apply:
              </p>
              {Object.entries(changes).map(([fieldName, change]) => (
                <div 
                  key={fieldName}
                  className="border border-gray-300 rounded-lg p-3 bg-white"
                >
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    {formatFieldName(fieldName)}
                  </p>
                  <div className="flex items-center gap-3">
                    {/* Before */}
                    <div className="flex-1 bg-red-50 border border-red-200 rounded p-2">
                      <p className="text-xs text-red-600 font-medium mb-1">Before</p>
                      <p className="text-sm text-red-900 break-words">
                        {renderValue(change.old)}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />

                    {/* After */}
                    <div className="flex-1 bg-green-50 border border-green-200 rounded p-2">
                      <p className="text-xs text-green-600 font-medium mb-1">After</p>
                      <p className="text-sm text-green-900 break-words font-semibold">
                        {renderValue(change.new)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CREATE Preview - Show new entries */}
      {!isUpdate && entries.length > 0 && (
        <Card className="border-2 border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              New {entries.length > 1 ? 'Entries' : 'Entry'} to Add ({entries.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {renderPreview ? (
              <div className="space-y-3">
                {entries.map((entry, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {renderPreview(entry)}
                  </div>
                ))}
              </div>
            ) : (
              <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
                {JSON.stringify(entries, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => setCancelDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onRegenerate}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Regenerate
          </Button>

          <Button
            onClick={onConfirm}
            className={`flex items-center gap-2 ${
              isUpdate 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            {isUpdate ? `Apply ${changesCount} Change${changesCount > 1 ? 's' : ''}` : `Add ${entries.length} Entr${entries.length > 1 ? 'ies' : 'y'}`}
          </Button>
        </div>
      </div>

      {/* Cancel confirmation dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Operation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this {isUpdate ? 'update' : 'creation'} operation? 
              All changes will be discarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Continue</AlertDialogCancel>
            <AlertDialogAction
              onClick={onCancel}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
