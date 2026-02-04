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
          <CardDescription>Sample implementation of the new color scheme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Primary Colors */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Primary Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <div className="h-12 rounded-md bg-primary"></div>
                <span className="text-xs text-muted-foreground">Primary</span>
              </div>
              <div className="space-y-2">
                <div className="h-12 rounded-md bg-secondary"></div>
                <span className="text-xs text-muted-foreground">Secondary</span>
              </div>
              <div className="space-y-2">
                <div className="h-12 rounded-md bg-accent"></div>
                <span className="text-xs text-muted-foreground">Accent</span>
              </div>
              <div className="space-y-2">
                <div className="h-12 rounded-md bg-success"></div>
                <span className="text-xs text-muted-foreground">Success</span>
              </div>
              <div className="space-y-2">
                <div className="h-12 rounded-md bg-warning"></div>
                <span className="text-xs text-muted-foreground">Warning</span>
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
              <p className="text-sm text-muted-foreground mt-1">This is a sample card using card colors</p>
            </div>

            <div className="p-4 rounded-lg bg-muted text-muted-foreground">
              <p className="font-medium">Muted Section</p>
              <p className="text-sm mt-1">This is a sample muted area</p>
            </div>

            <div className="p-4 rounded-lg bg-popover text-popover-foreground border border-border">
              <p className="font-medium">Popover Style</p>
              <p className="text-sm text-muted-foreground mt-1">This demonstrates popover colors</p>
            </div>

            <div className="p-4 rounded-lg state-info">
              <p className="font-medium">Info State</p>
              <p className="text-sm mt-1">This demonstrates the new info color state</p>
            </div>

            <div className="p-4 rounded-lg state-muted-light border border-border">
              <p className="font-medium">Muted Light State</p>
              <p className="text-sm text-muted-foreground mt-1">This demonstrates the new muted light color state</p>
            </div>

            <div className="p-4 rounded-lg state-muted-dark border border-border">
              <p className="font-medium">Muted Dark State</p>
              <p className="text-sm text-muted-foreground mt-1">This demonstrates the new muted dark color state</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
