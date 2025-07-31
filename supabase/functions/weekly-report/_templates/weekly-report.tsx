import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface WeeklyReportEmailProps {
  userName: string
  daily_summaries: number
  tasks_generated: number
  tokens_earned: number
  focus_streak: number
}

export const WeeklyReportEmail = ({
  userName,
  daily_summaries,
  tasks_generated,
  tokens_earned,
  focus_streak,
}: WeeklyReportEmailProps) => (
  <Html>
    <Head />
    <Preview>Your Weekly Productivity at a Glance</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>UnclutterAI</Heading>
          <Text style={headerSubtext}>Your Weekly Productivity at a Glance</Text>
        </Section>

        <Section style={statsSection}>
          <Row>
            <Column style={statColumn}>
              <Text style={statEmoji}>🧠</Text>
              <Text style={statNumber}>{daily_summaries}</Text>
              <Text style={statLabel}>AI Summaries</Text>
            </Column>
            <Column style={statColumn}>
              <Text style={statEmoji}>✅</Text>
              <Text style={statNumber}>{tasks_generated}</Text>
              <Text style={statLabel}>Tasks Completed</Text>
            </Column>
          </Row>
          <Row>
            <Column style={statColumn}>
              <Text style={statEmoji}>💰</Text>
              <Text style={statNumber}>{tokens_earned}</Text>
              <Text style={statLabel}>UCT Tokens Earned</Text>
            </Column>
            <Column style={statColumn}>
              <Text style={statEmoji}>🔥</Text>
              <Text style={statNumber}>{focus_streak}</Text>
              <Text style={statLabel}>Focus Streak</Text>
            </Column>
          </Row>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            Keep going — you're building momentum.
          </Text>
          <Text style={brandText}>
            UnclutterAI - Your AI-powered productivity companion
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default WeeklyReportEmail

const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const header = {
  textAlign: 'center' as const,
  padding: '32px 0',
}

const h1 = {
  color: '#1e293b',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  textAlign: 'center' as const,
}

const headerSubtext = {
  color: '#64748b',
  fontSize: '18px',
  margin: '0',
  textAlign: 'center' as const,
}

const statsSection = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '32px',
  margin: '24px 0',
  border: '1px solid #e2e8f0',
}

const statColumn = {
  textAlign: 'center' as const,
  padding: '16px',
}

const statEmoji = {
  fontSize: '32px',
  margin: '0 0 8px',
}

const statNumber = {
  color: '#1e293b',
  fontSize: '36px',
  fontWeight: 'bold',
  margin: '0 0 4px',
}

const statLabel = {
  color: '#64748b',
  fontSize: '14px',
  margin: '0',
  fontWeight: '500',
}

const footer = {
  textAlign: 'center' as const,
  padding: '24px 0',
}

const footerText = {
  color: '#1e293b',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px',
}

const brandText = {
  color: '#94a3b8',
  fontSize: '12px',
  margin: '0',
}