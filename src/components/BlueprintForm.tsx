import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Building2, Loader2 } from "lucide-react";
import { BlueprintFormData } from "@/types/blueprint";

interface BlueprintFormProps {
  onSubmit: (data: BlueprintFormData) => void;
  isLoading: boolean;
}

export function BlueprintForm({ onSubmit, isLoading }: BlueprintFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<BlueprintFormData>({
    businessName: "",
    industry: "",
    location: "",
    primaryServices: "",
    targetCustomers: "",
    uniqueSellingPoints: "",
    brandVoice: "Professional",
    mainPhone: "",
    contactEmail: "",
    specialOffer: "",
    websiteGoal: "Get more leads",
  });

  const handleChange = (field: keyof BlueprintFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isValid = formData.businessName && formData.industry && formData.location;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Building2 className="w-4 h-4" />
          No Client Website? Create Blueprint
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Client Website Blueprint</DialogTitle>
          <DialogDescription>
            Fill in your client's business details and we'll generate a complete website blueprint with copy, SEO, and structure.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Client Business Name *</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => handleChange("businessName", e.target.value)}
                placeholder="Tampa AC Services"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => handleChange("industry", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HVAC">HVAC</SelectItem>
                  <SelectItem value="Plumbing">Plumbing</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Roofing">Roofing</SelectItem>
                  <SelectItem value="Landscaping">Landscaping</SelectItem>
                  <SelectItem value="Pest Control">Pest Control</SelectItem>
                  <SelectItem value="Cleaning">Cleaning</SelectItem>
                  <SelectItem value="Dental">Dental</SelectItem>
                  <SelectItem value="Med Spa">Med Spa</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Client Location (City, State) *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="Tampa, FL"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryServices">Primary Services (comma-separated)</Label>
            <Textarea
              id="primaryServices"
              value={formData.primaryServices}
              onChange={(e) => handleChange("primaryServices", e.target.value)}
              placeholder="AC Repair, AC Installation, Maintenance Plans, Emergency Service"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetCustomers">Target Customers</Label>
            <Input
              id="targetCustomers"
              value={formData.targetCustomers}
              onChange={(e) => handleChange("targetCustomers", e.target.value)}
              placeholder="Homeowners, property managers, small businesses"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="uniqueSellingPoints">Unique Selling Points</Label>
            <Textarea
              id="uniqueSellingPoints"
              value={formData.uniqueSellingPoints}
              onChange={(e) => handleChange("uniqueSellingPoints", e.target.value)}
              placeholder="24/7 emergency service, 20+ years experience, locally owned, satisfaction guarantee"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brandVoice">Brand Voice</Label>
              <Select
                value={formData.brandVoice}
                onValueChange={(value) => handleChange("brandVoice", value as BlueprintFormData["brandVoice"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Friendly">Friendly</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Luxury">Luxury</SelectItem>
                  <SelectItem value="High-energy">High-energy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="websiteGoal">Website Goal</Label>
              <Input
                id="websiteGoal"
                value={formData.websiteGoal}
                onChange={(e) => handleChange("websiteGoal", e.target.value)}
                placeholder="Get more leads"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mainPhone">Client Phone Number</Label>
              <Input
                id="mainPhone"
                value={formData.mainPhone}
                onChange={(e) => handleChange("mainPhone", e.target.value)}
                placeholder="(813) 555-1234"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Client Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleChange("contactEmail", e.target.value)}
                placeholder="info@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialOffer">Special Offer (optional)</Label>
            <Input
              id="specialOffer"
              value={formData.specialOffer}
              onChange={(e) => handleChange("specialOffer", e.target.value)}
              placeholder="$50 off your first service"
            />
          </div>

          <Button type="submit" className="w-full" disabled={!isValid || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating client blueprint...
              </>
            ) : (
              "Generate Client Blueprint"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
