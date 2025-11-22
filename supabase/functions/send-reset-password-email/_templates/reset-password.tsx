import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface ResetPasswordEmailProps {
  supabase_url: string;
  token_hash: string;
  email_action_type: string;
  redirect_to: string;
}

export const ResetPasswordEmail = ({
  supabase_url,
  token_hash,
  email_action_type,
  redirect_to,
}: ResetPasswordEmailProps) => (
  <Html>
    <Head />
    <Preview>Restablece tu contraseña de PlazaMedik</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🔐 Restablecimiento de Contraseña</Heading>
        <Text style={text}>
          Hola,
        </Text>
        <Text style={text}>
          Recibimos una solicitud para restablecer la contraseña de tu cuenta de administrador en <strong>PlazaMedik</strong>.
        </Text>
        <Section style={buttonContainer}>
          <Link
            href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
            target="_blank"
            style={button}
          >
            Restablecer Contraseña
          </Link>
        </Section>
        <Text style={text}>
          Este enlace expirará en <strong>24 horas</strong> por seguridad.
        </Text>
        <Text style={warningText}>
          ⚠️ Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
        </Text>
        <Text style={footer}>
          © {new Date().getFullYear()} PlazaMedik - Sistema de Gestión Administrativa
          <br />
          <Link
            href="https://plazamedik.net.pe"
            target="_blank"
            style={footerLink}
          >
            plazamedik.net.pe
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ResetPasswordEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  marginTop: '40px',
  marginBottom: '40px',
  borderRadius: '8px',
  maxWidth: '600px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 30px',
  padding: '0',
  lineHeight: '1.4',
};

const text = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const warningText = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '20px 0',
  padding: '16px',
  backgroundColor: '#fff8e1',
  borderRadius: '6px',
  borderLeft: '4px solid #ffc107',
};

const buttonContainer = {
  margin: '32px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#0ea5e9',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  lineHeight: '1.5',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '20px',
  marginTop: '40px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e6ebf1',
  paddingTop: '20px',
};

const footerLink = {
  color: '#0ea5e9',
  textDecoration: 'underline',
};
