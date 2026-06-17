export type Target = 'website' | 'mobile' | 'tablet'

export interface DesignTokens {
  primary: string
  background: string
  text: string
  accent: string
  font_family: string
  radius: string
}

export interface ComponentSpec {
  name: string
  description: string
}

export interface DesignState {
  target: Target
  title: string
  intent: string
  components: ComponentSpec[]
  tokens: DesignTokens
  notes: string[]
}
