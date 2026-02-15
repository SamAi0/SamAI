'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function ColorDemo() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Color Palette Demo</CardTitle>
          <CardDescription>Sample implementation of the latest color scheme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Primary & Accent Colors */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Brand Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-12 rounded-md bg-primary" />
                <span className="text-xs text-muted-foreground">Primary (Blue)</span>
              </div>
              <div className="space-y-2">
                <div className="h-12 rounded-md bg-accent" />
                <span className="text-xs text-muted-foreground">Accent (Purple)</span>
              </div>
              <div className="space-y-2">
                <div className="h-12 rounded-md bg-success" />
                <span className="text-xs text-muted-foreground">Success (Emerald)</span>
              </div>
              <div className="space-y-2">
                <div className="h-12 rounded-md bg-warning" />
                <span className="text-xs text-muted-foreground">Warning (Warm)</span>
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Status Badges</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge className="bg-success text-success-foreground">Success</Badge>
              <Badge className="bg-warning text-warning-foreground">Warning</Badge>
              <Badge className="bg-muted text-muted-foreground">Muted</Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Action Buttons</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="default">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button className="bg-success hover:bg-[hsl(var(--success-hover))] text-success-foreground">
                Success
              </Button>
              <Button className="bg-warning hover:bg-[hsl(var(--warning-hover))] text-warning-foreground">
                Warning
              </Button>
              <Button className="bg-[hsl(var(--info))] hover:bg-[hsl(var(--info-hover))] text-[hsl(var(--info-foreground))]">
                Info
              </Button>
            </div>
          </div>

          {/* Sample Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Sample Content Areas</h3>

            <div className="p-4 rounded-lg bg-card text-card-foreground border border-border">
              <p className="font-medium">Card Component</p>
              <p className="text-sm text-muted-foreground mt-1">This uses the latest card and text colors.</p>
            </div>

            <div className="p-4 rounded-lg bg-muted text-muted-foreground">
              <p className="font-medium">Muted Section</p>
              <p className="text-sm mt-1">Muted background and foreground colors.</p>
            </div>

            <div className="p-4 rounded-lg bg-popover text-popover-foreground border border-border">
              <p className="font-medium">Popover Style</p>
              <p className="text-sm text-muted-foreground mt-1">Popover with border and muted text.</p>
            </div>

            <div className="p-4 rounded-lg state-info">
              <p className="font-medium">Info State</p>
              <p className="text-sm mt-1">This uses the info semantic color.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
