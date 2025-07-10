import { Receipt, Lightbulb, LineChart, Share2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockWalletPasses } from "@/lib/data";

const iconMap = {
  "Receipt Summary": <Receipt className="h-6 w-6" />,
  "Budget Tip": <Lightbulb className="h-6 w-6" />,
  "Investment Plan": <LineChart className="h-6 w-6" />,
};

export default function WalletPasses() {
  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">My Wallet Passes</h1>
            <p className="text-muted-foreground">Shareable summaries of your receipts, budget tips, and investment plans.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockWalletPasses.map((pass) => (
                <Card key={pass.id} className="flex flex-col">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="grid gap-1">
                            <CardTitle className="flex items-center gap-2">
                                {iconMap[pass.type]}
                                {pass.title}
                            </CardTitle>
                            <CardDescription>{pass.type}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground">
                            {pass.description}
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline">{pass.cta}</Button>
                        <Button variant="ghost" size="icon">
                            <Share2 className="h-4 w-4" />
                            <span className="sr-only">Share</span>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    </div>
  );
}
