// client/src/components/FileUploader.tsx
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2, Loader2 } from 'lucide-react';
import { apiClient } from '../../../core/api/client';
import { useAuth } from '../../../core/context/auth';

/**
 * FileUploader Component
 * Provides a drag-and-drop interface for uploading system log files.
 * Supports .json, .log, and .txt formats for processing incident telemetry.
 */
export default function FileUploader({ onUploadSuccess }: { onUploadSuccess: () => void }) {
    // UI state for drag-and-drop interactions
    const [isDragging, setIsDragging] = useState(false);
    
    // Status management for the upload lifecycle
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [fileName, setFileName] = useState<string | null>(null);

    const { activeProject } = useAuth();
    
    // Reference to the hidden native file input
    const fileInputRef = useRef<HTMLInputElement>(null);

    /**
     * core logic for transmitting the log file to the Express backend.
     * Uses FormData for multipart/form-data encoding as required by Multer.
     */
    const handleUpload = async (file: File) => {
        if (!activeProject) return;

        setFileName(file.name);
        setUploadStatus('uploading');

        const formData = new FormData();
        // 'logfile' key must match the identifier expected by the backend Multer middleware
        formData.append('logfile', file); 
        formData.append('projectId', activeProject.id);

        try {
            // Sends the file to the dedicated ingestion endpoint
            const response = await apiClient.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            console.log("Server response:", response.data);
            setUploadStatus('success');
            
            // Notifies parent dashboard to refresh incident feeds
            onUploadSuccess();

            // Automatically resets the UI state after a short delay
            setTimeout(() => setUploadStatus('idle'), 3000);
        } catch (error) {
            console.error("Upload failed", error);
            setUploadStatus('error');
            setTimeout(() => setUploadStatus('idle'), 3000);
        }
    };

    /**
     * Drag-and-drop event handlers for managing visual feedback states
     */
    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => setIsDragging(false);

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="w-full max-w-2xl mt-8 mb-8">
            {/* Hidden native input specifically for triggering via the animated dropzone */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json,.log,.txt"
                onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
            />

            {/* The Animated Dropzone: Interactive container for file ingestion */}
            <motion.div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                animate={{
                    scale: isDragging ? 1.02 : 1,
                    borderColor: isDragging ? '#8b5cf6' : '#27272a',
                    backgroundColor: isDragging ? 'rgba(139, 92, 246, 0.05)' : '#18181b',
                }}
                className="w-full h-48 border-2 border-dashed rounded-xl cursor-pointer flex flex-col items-center justify-center transition-colors relative overflow-hidden"
            >
                <AnimatePresence mode="wait">
                    
                    {/* STATE: Idle - Standard prompt for user action */}
                    {uploadStatus === 'idle' && (
                        <motion.div 
                            key="idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center text-center pointer-events-none"
                        >
                            <div className={`p-4 rounded-full mb-4 ${isDragging ? 'bg-primary/20 text-primary' : 'bg-surfaceBorder/50 text-muted'}`}>
                                <UploadCloud size={32} />
                            </div>
                            <h3 className="text-gray-200 font-semibold mb-1">Upload Crash Logs</h3>
                            <p className="text-sm text-muted">Drag & drop your .json or .log files here, or click to browse</p>
                        </motion.div>
                    )}

                    {/* STATE: Uploading - Active progress indicator */}
                    {uploadStatus === 'uploading' && (
                        <motion.div 
                            key="uploading"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="flex flex-col items-center"
                        >
                            <Loader2 size={32} className="text-primary animate-spin mb-4" />
                            <p className="text-gray-200 font-medium">Uploading {fileName}...</p>
                        </motion.div>
                    )}

                    {/* STATE: Success - Confirmation of ingestion and parsing */}
                    {uploadStatus === 'success' && (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center text-green-500"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                            >
                                <CheckCircle2 size={48} className="mb-4" />
                            </motion.div>
                            <p className="font-semibold text-lg">Upload Complete!</p>
                            <p className="text-sm text-green-500/70 opacity-80 mt-1">Our engine is parsing the events.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}