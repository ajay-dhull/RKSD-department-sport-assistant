import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Edit2, 
  Trash2, 
  Pencil,
  AlertCircle,
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

interface EnhancedAIPreviewProps {
  entries: any[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  renderPreview: (entry: any, index: number) => React.ReactNode;
  onConfirmAll: () => void;
  onRegenerate: () => void;
  onEditEntry?: (entry: any, index: number) => void;
  onDeleteEntry?: (index: number) => void;
  confirmButtonText?: string;
  entryTypeName?: string;
}

export function EnhancedAIPreview({
  entries,
  currentIndex,
  onIndexChange,
  renderPreview,
  onConfirmAll,
  onRegenerate,
  onEditEntry,
  onDeleteEntry,
  confirmButtonText = "Add All Entries",
  entryTypeName = "Entry",
}: EnhancedAIPreviewProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);

  if (!entries || entries.length === 0) {
    return null;
  }

  const totalEntries = entries.length;
  const hasMultiple = totalEntries > 1;

  const goToPrevious = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < totalEntries - 1) {
      onIndexChange(currentIndex + 1);
    }
  };

  const handleDeleteClick = (index: number) => {
    setEntryToDelete(index);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (entryToDelete !== null && onDeleteEntry) {
      onDeleteEntry(entryToDelete);
      if (currentIndex >= totalEntries - 1 && currentIndex > 0) {
        onIndexChange(currentIndex - 1);
      }
    }
    setDeleteDialogOpen(false);
    setEntryToDelete(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2.5 bg-green-50 border border-green-200 rounded-md">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-green-900">
            {totalEntries} {entryTypeName}{totalEntries > 1 ? 's' : ''} Generated
          </span>
        </div>
        {hasMultiple && (
          <div className="flex items-center gap-2 justify-between sm:justify-end">
            <span className="text-xs text-green-700 font-medium">
              {currentIndex + 1} / {totalEntries}
            </span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className="h-11 w-11 sm:h-9 sm:w-auto sm:px-3 p-0 border-green-300"
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={goToNext}
                disabled={currentIndex === totalEntries - 1}
                className="h-11 w-11 sm:h-9 sm:w-auto sm:px-3 p-0 border-green-300"
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Card className="border border-gray-300 shadow-sm">
        <CardHeader className="pb-3 bg-gray-50 border-b">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
              Preview {hasMultiple ? `#${currentIndex + 1}` : ''}
            </CardTitle>
            <div className="flex gap-1">
              {onEditEntry && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditEntry(entries[currentIndex], currentIndex)}
                  className="h-11 min-w-[44px] px-3 sm:h-9 sm:px-2 text-amber-700 hover:bg-amber-50"
                >
                  <Edit2 className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline text-xs">Edit</span>
                </Button>
              )}
              {onDeleteEntry && totalEntries > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(currentIndex)}
                  className="h-11 min-w-[44px] px-3 sm:h-9 sm:px-2 text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline text-xs">Delete</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 pb-4">
          <div className="text-sm">
            {renderPreview(entries[currentIndex], currentIndex)}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button 
          onClick={onConfirmAll} 
          className="w-full sm:flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-2 shadow-md"
        >
          <CheckCircle className="h-4 w-4 mr-1.5" />
          <span className="text-sm">{confirmButtonText}</span>
        </Button>
        <Button 
          onClick={onRegenerate} 
          variant="outline" 
          className="w-full sm:flex-1 border-gray-300 hover:bg-gray-50 font-medium py-2"
        >
          <Pencil className="h-4 w-4 mr-1.5" />
          <span className="text-sm">Edit Prompt</span>
        </Button>
      </div>

      {hasMultiple && (
        <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <AlertCircle className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-900">
            Review all entries using navigation. Click "Confirm" to add all to the system.
          </p>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {entryTypeName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {entryTypeName} #{entryToDelete !== null ? entryToDelete + 1 : ''} from the preview. 
              The remaining entries will still be available to add.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
