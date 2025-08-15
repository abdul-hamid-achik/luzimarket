"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { createVendorStripeAccount, createVendorOnboardingLink, updateVendorStripeAccountStatus } from "@/lib/actions/stripe-connect.action";
import { toast } from "sonner";

interface StripeOnboardingClientProps {
  vendor: {
    id: string;
    businessName: string;
    email: string;
  };
  stripeAccount: any | null;
}

export function StripeOnboardingClient({ vendor, stripeAccount }: StripeOnboardingClientProps) {
  const t = useTranslations("Vendor.stripeOnboarding");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateAccount = async () => {
    setIsLoading(true);
    try {
      const result = await createVendorStripeAccount({
        vendorId: vendor.id,
        email: vendor.email,
        businessName: vendor.businessName,
        country: "MX",
        type: "express",
      });

      if (result.success) {
        toast.success(t("accountCreated"));
        router.refresh();
      } else {
        toast.error(result.error || t("accountCreationFailed"));
      }
    } catch (error) {
      toast.error(t("accountCreationFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOnboarding = async () => {
    setIsLoading(true);
    try {
      const baseUrl = window.location.origin;
      const refreshUrl = `${baseUrl}/vendor/stripe-onboarding`;
      const returnUrl = `${baseUrl}/vendor/stripe-onboarding?return=true`;

      const result = await createVendorOnboardingLink({
        vendorId: vendor.id,
        refreshUrl,
        returnUrl,
      });

      if (result.success && result.data?.url) {
        window.location.href = result.data.url;
      } else {
        toast.error(result.error || t("onboardingLinkFailed"));
      }
    } catch (error) {
      toast.error(t("onboardingLinkFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setIsLoading(true);
    try {
      const result = await updateVendorStripeAccountStatus({
        vendorId: vendor.id,
      });

      if (result.success) {
        toast.success(t("statusUpdated"));
        router.refresh();
      } else {
        toast.error(result.error || t("statusUpdateFailed"));
      }
    } catch (error) {
      toast.error(t("statusUpdateFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!stripeAccount) return null;

    if (stripeAccount.chargesEnabled && stripeAccount.payoutsEnabled) {
      return <Badge className="bg-green-600">{t("status.active")}</Badge>;
    } else if (stripeAccount.detailsSubmitted) {
      return <Badge className="bg-yellow-600">{t("status.pending")}</Badge>;
    } else {
      return <Badge className="bg-gray-600">{t("status.incomplete")}</Badge>;
    }
  };

  const renderRequirements = () => {
    if (!stripeAccount?.requirements) return null;

    const { currentlyDue, pastDue } = stripeAccount.requirements;

    if ((!currentlyDue || currentlyDue.length === 0) && (!pastDue || pastDue.length === 0)) {
      return null;
    }

    return (
      <Alert className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-semibold mb-2">{t("requirementsTitle")}</p>
          {pastDue && pastDue.length > 0 && (
            <div className="mb-2">
              <p className="text-sm font-medium text-red-600">{t("pastDue")}:</p>
              <ul className="list-disc list-inside text-sm">
                {pastDue.map((req: string) => (
                  <li key={req}>{req}</li>
                ))}
              </ul>
            </div>
          )}
          {currentlyDue && currentlyDue.length > 0 && (
            <div>
              <p className="text-sm font-medium">{t("currentlyDue")}:</p>
              <ul className="list-disc list-inside text-sm">
                {currentlyDue.map((req: string) => (
                  <li key={req}>{req}</li>
                ))}
              </ul>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  // No Stripe account yet
  if (!stripeAccount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("getStarted.title")}</CardTitle>
          <CardDescription>{t("getStarted.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <h3 className="font-semibold mb-2">{t("benefits.title")}</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                  <span>{t("benefits.instantPayments")}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                  <span>{t("benefits.automaticPayouts")}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                  <span>{t("benefits.financialReports")}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                  <span>{t("benefits.secureTransactions")}</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={handleCreateAccount}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("creating")}
                </>
              ) : (
                t("createAccount")
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Has Stripe account
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("accountStatus.title")}</CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription>{t("accountStatus.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div>
                  {stripeAccount.chargesEnabled ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{t("features.acceptPayments")}</p>
                  <p className="text-xs text-muted-foreground">
                    {stripeAccount.chargesEnabled ? t("enabled") : t("disabled")}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div>
                  {stripeAccount.payoutsEnabled ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{t("features.receivePayouts")}</p>
                  <p className="text-xs text-muted-foreground">
                    {stripeAccount.payoutsEnabled ? t("enabled") : t("disabled")}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div>
                  {stripeAccount.detailsSubmitted ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{t("features.detailsSubmitted")}</p>
                  <p className="text-xs text-muted-foreground">
                    {stripeAccount.detailsSubmitted ? t("complete") : t("incomplete")}
                  </p>
                </div>
              </div>
            </div>

            {renderRequirements()}

            <div className="flex flex-col sm:flex-row gap-3">
              {(!stripeAccount.chargesEnabled || !stripeAccount.payoutsEnabled || 
                (stripeAccount.requirements?.currentlyDue && stripeAccount.requirements.currentlyDue.length > 0)) && (
                <Button
                  onClick={handleStartOnboarding}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("loading")}
                    </>
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {stripeAccount.detailsSubmitted ? t("updateDetails") : t("completeOnboarding")}
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={handleRefreshStatus}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("refreshing")}
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t("refreshStatus")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {stripeAccount.chargesEnabled && stripeAccount.payoutsEnabled && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {t("successMessage")}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}