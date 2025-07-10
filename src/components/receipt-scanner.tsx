"use client"

import { useState } from 'react';
import { Upload, Loader2, Save } from 'lucide-react';

import { extractReceiptData, ExtractReceiptDataOutput } from '@/ai/flows/extract-receipt-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from './ui/table';

export default function ReceiptScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractReceiptDataOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setExtractedData(null);
    }
  };

  const handleScanReceipt = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a receipt image to scan.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setExtractedData(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const photoDataUri = reader.result as string;
        const result = await extractReceiptData({ photoDataUri });
        setExtractedData(result);
        toast({
          title: 'Scan Successful',
          description: 'Receipt data has been extracted.',
        });
      };
      reader.onerror = () => {
        throw new Error("Could not read file");
      }
    } catch (error) {
      console.error('Error scanning receipt:', error);
      toast({
        title: 'Scan Failed',
        description: 'Could not extract data from the receipt. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="receipt-upload">Upload Receipt</Label>
        <div className="flex gap-2">
            <Input id="receipt-upload" type="file" accept="image/*" onChange={handleFileChange} />
            <Button onClick={handleScanReceipt} disabled={!file || isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Scan Receipt</span>
            </Button>
        </div>
      </div>
      
      {extractedData && (
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="text-lg font-semibold">Extracted Data</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
                <Label>Vendor</Label>
                <Input defaultValue={extractedData.vendor} />
            </div>
            <div className="space-y-1">
                <Label>Date</Label>
                <Input defaultValue={extractedData.date} />
            </div>
            <div className="space-y-1 sm:col-span-2">
                <Label>Total Amount</Label>
                <Input type="number" defaultValue={extractedData.totalAmount} />
            </div>
          </div>
          {extractedData.items && extractedData.items.length > 0 && (
            <div>
                <Label>Items</Label>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {extractedData.items.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.description}</TableCell>
                                <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          )}
           <Button className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Receipt
          </Button>
        </div>
      )}
    </div>
  );
}
