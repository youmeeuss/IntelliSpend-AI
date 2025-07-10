import ReceiptScanner from "@/components/receipt-scanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewReceiptPage() {
    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Intelligent Receipt Scanner</CardTitle>
                    <CardDescription>
                        Upload a photo of your receipt, and our AI will extract the details for you.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ReceiptScanner />
                </CardContent>
            </Card>
        </div>
    )
}
