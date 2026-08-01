'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type NoteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  noteTitle?: string;
  noteContent: string;
  onNoteTitleChange?: (value: string) => void;
  onNoteContentChange: (value: string) => void;
  onSave: () => void;
  saving?: boolean;
  showTitleField?: boolean;
  saveLabel?: string;
};

export function NoteDialog({
  open,
  onOpenChange,
  title = 'Add Note',
  description = 'Write a short note and save.',
  noteTitle = '',
  noteContent,
  onNoteTitleChange,
  onNoteContentChange,
  onSave,
  saving = false,
  showTitleField = false,
  saveLabel = 'Save Note',
}: NoteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {showTitleField ? (
            <Input
              placeholder="Title"
              value={noteTitle}
              onChange={(event) => onNoteTitleChange?.(event.target.value)}
              autoFocus
            />
          ) : null}
          <Textarea
            placeholder="Write your note…"
            rows={4}
            value={noteContent}
            onChange={(event) => onNoteContentChange(event.target.value)}
            autoFocus={!showTitleField}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving || !noteContent.trim()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type TaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  subject: string;
  notes: string;
  due?: string;
  onSubjectChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onDueChange?: (value: string) => void;
  onSave: () => void;
  saving?: boolean;
  showDueField?: boolean;
};

export function TaskDialog({
  open,
  onOpenChange,
  title = 'Add Task',
  description = 'Create a follow-up task linked to this record.',
  subject,
  notes,
  due = '',
  onSubjectChange,
  onNotesChange,
  onDueChange,
  onSave,
  saving = false,
  showDueField = true,
}: TaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Subject"
            value={subject}
            onChange={(event) => onSubjectChange(event.target.value)}
            autoFocus
          />
          <Textarea
            placeholder="Notes…"
            rows={3}
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
          />
          {showDueField ? (
            <Input
              type="datetime-local"
              value={due}
              onChange={(event) => onDueChange?.(event.target.value)}
            />
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving || !subject.trim()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
