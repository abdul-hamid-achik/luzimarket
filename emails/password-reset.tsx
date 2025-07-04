import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
  Tailwind,
} from '@react-email/components'

interface PasswordResetEmailProps {
  name: string
  resetUrl: string
}

export function PasswordResetEmail({ name, resetUrl }: PasswordResetEmailProps) {
  const previewText = `Restablecer tu contraseña en LUZIMARKET`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Section className="mt-[32px]">
              <Img
                src={`${process.env.NEXT_PUBLIC_APP_URL}/images/logos/logo-simple.png`}
                width="120"
                height="40"
                alt="LUZIMARKET"
                className="my-0 mx-auto"
              />
            </Section>
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Restablecer tu contraseña
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hola {name},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta en LUZIMARKET. 
              Si no realizaste esta solicitud, puedes ignorar este correo de manera segura.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Para restablecer tu contraseña, haz clic en el siguiente enlace:
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-black rounded text-white text-[12px] font-semibold no-underline text-center px-[20px] py-[12px]"
                href={resetUrl}
              >
                Restablecer contraseña
              </Button>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              O copia y pega este enlace en tu navegador:
            </Text>
            <Link href={resetUrl} className="text-blue-600 no-underline text-[14px] break-all">
              {resetUrl}
            </Link>
            <Text className="text-black text-[14px] leading-[24px] mt-[24px]">
              Este enlace expirará en 1 hora por razones de seguridad.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Si tienes algún problema, contáctanos en{' '}
              <Link href="mailto:soporte@luzimarket.shop" className="text-blue-600 no-underline">
                soporte@luzimarket.shop
              </Link>
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Este correo fue enviado a {name} porque se solicitó un restablecimiento de contraseña 
              para una cuenta asociada con esta dirección de correo electrónico. Si no realizaste 
              esta solicitud, puedes ignorar este correo de manera segura.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

// Add missing import
function Hr(props: any) {
  return <hr {...props} />
}