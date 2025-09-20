import React from 'react'
import { Button } from '@/components/ui/button'

interface MobileFloatingButtonProps {
    price: number
    originalPrice?: number
    currency: string
    bookingButtonText: string
    onBookingClick: () => void
}

export function MobileFloatingButton({
    price,
    originalPrice,
    currency,
    bookingButtonText,
    onBookingClick
}: MobileFloatingButtonProps) {
    return (
        <div className="MobileOnlyButtonContainer">
            <div>
                <div>
                    <span style={{ color: "grey" }}>From</span>
                    <span className="text-3xl font-bold text-orange-500">
                        {currency === "USD"
                            ? "₹"
                            : currency == "INR"
                                ? "₹"
                                : currency}{" "}
                        {price}
                    </span>
                    {originalPrice && (
                        <span className="text-lg text-muted-foreground line-through">
                            {currency === "USD"
                                ? "₹"
                                : currency == "INR"
                                    ? "₹"
                                    : currency}{" "}
                            {originalPrice}
                        </span>
                    )}
                </div>
            </div>
            <div>
                <Button
                    size="lg"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={onBookingClick}
                >
                    {bookingButtonText}
                </Button>
            </div>
        </div>
    )
}
