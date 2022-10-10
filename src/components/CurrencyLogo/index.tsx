import { Currency, ETHER, Token } from '@uniswap/sdk'
import React, { useMemo } from 'react'
import styled from 'styled-components'
import useHttpLocations from 'hooks/useHttpLocations'
import { WrappedTokenInfo } from 'state/lists/hooks'
import Logo from '../Logo'
import FantomLogo from 'assets/images/fantom-logo.png'
import PumpkinLogo from 'assets/images/pumpkin.png'

const tokenlists = {
  '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83': FantomLogo,
  '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E': 'https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png',
  '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75': 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
  '0xD67de0e0a0Fd7b15dC8348Bb9BE742F3c5850454': 'https://s2.coinmarketcap.com/static/img/coins/64x64/7192.png',
  '0x74b23882a30290451A17c44f4F05243b6b58C76d': 'https://s2.coinmarketcap.com/static/img/coins/64x64/2396.png',
  '0xAD522217E64Ec347601015797Dd39050A2a69694': PumpkinLogo
}

const getTokenLogoURL = (address: string) => (tokenlists as any)[address]

const StyledFantomLogo = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  border-radius: 24px;
`

const StyledLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: 50%;
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  background-color: ${({ theme }) => theme.white};
`

export default function CurrencyLogo({
  currency,
  size = '24px',
  style
}: {
  currency?: Currency
  size?: string
  style?: React.CSSProperties
}) {
  const uriLocations = useHttpLocations(currency instanceof WrappedTokenInfo ? currency.logoURI : undefined)
  const srcs: string[] = useMemo(() => {
    if (currency === ETHER) return []

    if (currency instanceof Token) {
      if (currency instanceof WrappedTokenInfo) {
        return [...uriLocations, getTokenLogoURL(currency.address)]
      }
      return [getTokenLogoURL(currency.address)]
    }
    return []
  }, [currency, uriLocations])

  if (currency === ETHER) {
    return <StyledFantomLogo src={FantomLogo} size={size} style={style} />
  }

  return <StyledLogo size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} />
}
