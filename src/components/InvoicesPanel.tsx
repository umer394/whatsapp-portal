import React, { useState, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';
import * as XLSX from 'xlsx';

// Register Handsontable modules
registerAllModules();

interface InvoicesPanelProps {
  onEscPress?: () => void;
}

const InvoicesPanel: React.FC<InvoicesPanelProps> = ({ onEscPress }) => {
  const { showToast } = useToast();
  
  // Invoices state variables
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceData, setInvoiceData] = useState<any[][]>([]);
  const [invoiceHeaders, setInvoiceHeaders] = useState<string[]>([]);
  const [isProcessingInvoice, setIsProcessingInvoice] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const invoiceFileInputRef = useRef<HTMLInputElement>(null);

  // Invoice file handling functions
  const handleInvoiceFileSelect = async (file: File) => {
    // Validate file type
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    if (!isExcel) {
      showToast('error', 'Please select an Excel file (.xlsx or .xls)');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showToast('error', 'File size exceeds 10MB limit');
      return;
    }

    setIsProcessingInvoice(true);
    setInvoiceFile(file);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length === 0) {
        showToast('error', 'The Excel file appears to be empty');
        return;
      }

      // Extract headers and data
      const headers = jsonData[0] as string[];
      const data = jsonData.slice(1) as any[][];
      
      setInvoiceHeaders(headers);
      setInvoiceData(data);
      
      showToast('success', `Excel file loaded successfully! Found ${data.length} rows.`);
    } catch (error) {
      console.error('Error reading Excel file:', error);
      showToast('error', 'Failed to read Excel file. Please make sure it\'s a valid Excel file.');
    } finally {
      setIsProcessingInvoice(false);
    }
  };

  const handleInvoiceInputClick = () => {
    invoiceFileInputRef.current?.click();
  };

  const handleInvoiceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleInvoiceFileSelect(file);
    }
    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  const handleInvoiceDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleInvoiceDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleInvoiceFileSelect(files[0]);
    }
  };

  const clearInvoiceData = () => {
    setInvoiceFile(null);
    setInvoiceData([]);
    setInvoiceHeaders([]);
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Hidden file input */}
      <input
        type="file"
        ref={invoiceFileInputRef}
        className="hidden"
        accept=".xlsx,.xls"
        onChange={handleInvoiceInputChange}
      />
      
      {invoiceData.length === 0 ? (
        // File dropzone when no file is loaded
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-2xl">
            <div
              className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? 'border-[#00a884] bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-[#00a884] hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onDragEnter={handleInvoiceDrag}
              onDragLeave={handleInvoiceDrag}
              onDragOver={handleInvoiceDrag}
              onDrop={handleInvoiceDrop}
            >
              {isProcessingInvoice ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#00a884] mb-4"></div>
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Processing Excel File
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Please wait while we read your file...
                  </p>
                </div>
              ) : (
                <>
                  <div className="mx-auto mb-6 h-16 w-16 text-gray-400">
                    <svg
                      className="h-full w-full"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
                    Drop your Excel file here
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    or{' '}
                    <button
                      className="text-[#00a884] hover:text-[#008f6f] font-medium underline"
                      onClick={handleInvoiceInputClick}
                    >
                      browse to choose a file
                    </button>
                  </p>
                  <div className="space-y-2 text-sm text-gray-400 dark:text-gray-500">
                    <p>• Supports .xlsx and .xls files</p>
                    <p>• Maximum file size: 10MB</p>
                    <p>• Only single file upload</p>
                  </div>
                  <div className="mt-8">
                    <button
                      onClick={handleInvoiceInputClick}
                      className="inline-flex items-center px-6 py-3 rounded-md text-white font-medium shadow-sm hover:opacity-90 transition-opacity"
                      style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Choose Excel File
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Display Excel data using Handsontable when file is loaded
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* File info header */}
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg mr-3">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {invoiceFile?.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {invoiceData.length} rows • {invoiceHeaders.length} columns
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleInvoiceInputClick}
                className="px-4 py-2 text-sm text-[#00a884] border border-[#00a884] rounded-md hover:bg-[#00a884] hover:text-white transition-colors"
              >
                Replace File
              </button>
              <button
                onClick={clearInvoiceData}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Handsontable container */}
          <div className="flex-1 overflow-hidden p-4">
            <div className="h-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <HotTable
                data={invoiceData}
                colHeaders={invoiceHeaders}
                rowHeaders={true}
                width="100%"
                height="100%"
                licenseKey="non-commercial-and-evaluation"
                stretchH="all"
                autoWrapRow={true}
                autoWrapCol={true}
                readOnly={true}
                contextMenu={false}
                manualColumnResize={true}
                manualRowResize={true}
                fixedRowsTop={0}
                columns={invoiceHeaders.map(() => ({
                  readOnly: true,
                  className: 'htMiddle htCenter'
                }))}
                cells={(row, col) => {
                  return {
                    readOnly: true
                  };
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPanel; 