import Link from "next/link";
import { PlusCircle, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mockReceipts } from "@/lib/data";
import Image from "next/image";
import { Badge } from "./ui/badge";

export default function ReceiptsList() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
            <div>
                <CardTitle>Receipt Vault</CardTitle>
                <CardDescription>
                    A centralized and organized digital archive of all your receipts.
                </CardDescription>
            </div>
            <Link href="/receipts/new">
                <Button size="sm" className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    Scan Receipt
                </Button>
            </Link>
        </div>
        <div className="flex items-center gap-4 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by vendor..."
              className="pl-8 w-full"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Filter</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Date</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>Last 30 days</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Last 90 days</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>This Year</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">
                <span className="sr-only">Image</span>
              </TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockReceipts.map((receipt) => (
              <TableRow key={receipt.id}>
                <TableCell className="hidden sm:table-cell">
                  <Image
                    alt="Receipt image"
                    className="aspect-square rounded-md object-cover"
                    height="64"
                    src={receipt.imageUrl}
                    width="64"
                    data-ai-hint="receipt"
                  />
                </TableCell>
                <TableCell className="font-medium">{receipt.vendor}</TableCell>
                <TableCell>{receipt.date}</TableCell>
                <TableCell className="text-right">${receipt.totalAmount.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
