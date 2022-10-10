import { ChainId } from '@uniswap/sdk'
import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { AlertTriangle, ArrowUpCircle } from 'react-feather'
import { Text } from 'rebass'
import Modal from '../Modal'
import { RowBetween } from '../Row'
import { AutoColumn, ColumnCenter } from '../Column'
import { ExternalLink } from 'theme'
import { CloseIcon, CustomLightSpinner } from 'theme/components'
import { getFtmscanLink } from 'utils'
import { useActiveWeb3React } from 'hooks'
import Circle from 'assets/images/blue-loader.svg'

const Wrapper = styled.div`
  width: 100%;
`
const Section = styled(AutoColumn)`
  padding: 24px;
`

const BottomSection = styled(Section)`
  background-color: ${({ theme }) => theme.bg2};
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
`

const ConfirmedIcon = styled(ColumnCenter)`
  padding: 60px 0;
`

function ConfirmationPendingContent({ onDismiss, pendingText }: { onDismiss: () => void; pendingText: string }) {
  return (
    <Wrapper>
      <Section>
        <RowBetween>
          <div />
          <CloseIcon className="text-gray-500 dark:text-white" onClick={onDismiss} />
        </RowBetween>
        <ConfirmedIcon>
          <CustomLightSpinner src={Circle} alt="loader" size={'90px'} />
        </ConfirmedIcon>
        <AutoColumn gap="12px" justify={'center'}>
          <Text fontWeight={500} fontSize={20} className="text-gray-500 dark:text-white">
            Waiting For Confirmation
          </Text>
          <AutoColumn gap="12px" justify={'center'}>
            <Text fontWeight={600} fontSize={14} textAlign="center" className="text-gray-500 dark:text-white">
              {pendingText}
            </Text>
          </AutoColumn>
          <Text fontSize={12} textAlign="center" className="text-gray-500 dark:text-white">
            Confirm this transaction in your wallet
          </Text>
        </AutoColumn>
      </Section>
    </Wrapper>
  )
}

function TransactionSubmittedContent({
  onDismiss,
  chainId,
  hash,
}: {
  onDismiss: () => void
  hash: string | undefined
  chainId: ChainId
}) {
  const theme = useContext(ThemeContext)

  return (
    <Wrapper>
      <Section>
        <RowBetween>
          <div />
          <CloseIcon className="tex-gray-500 dark:text-white" onClick={onDismiss} />
        </RowBetween>
        <ConfirmedIcon>
          <ArrowUpCircle strokeWidth={0.5} size={90} color={theme.primary1} />
        </ConfirmedIcon>
        <AutoColumn gap="12px" justify={'center'}>
          <Text fontWeight={500} fontSize={20} className="tex-gray-500 dark:text-white">
            Transaction Submitted
          </Text>
          {chainId && hash && (
            <ExternalLink href={getFtmscanLink(chainId, hash, 'transaction')}>
              <Text fontWeight={500} fontSize={14} color={theme.primary1}>
                View on Ftmscan
              </Text>
            </ExternalLink>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className={`bg-indigo-600 hover:bg-indigo-700 cursor-pointer w-full inline-flex items-center justify-center text-center px-4 py-3 border border-transparent shadow-sm font-medium text-lg rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-5`}
          >
            Close
          </button>
        </AutoColumn>
      </Section>
    </Wrapper>
  )
}

export function ConfirmationModalContent({
  title,
  bottomContent,
  onDismiss,
  topContent,
}: {
  title: string
  onDismiss: () => void
  topContent: () => React.ReactNode
  bottomContent: () => React.ReactNode
}) {
  return (
    <Wrapper>
      <Section>
        <RowBetween>
          <Text fontWeight={500} fontSize={20} className="tex-gray-500 dark:text-white">
            {title}
          </Text>
          <CloseIcon onClick={onDismiss} className="tex-gray-500 dark:text-white" />
        </RowBetween>
        {topContent()}
      </Section>
      <BottomSection gap="12px">{bottomContent()}</BottomSection>
    </Wrapper>
  )
}

export function TransactionErrorContent({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const theme = useContext(ThemeContext)
  return (
    <Wrapper>
      <Section>
        <RowBetween>
          <Text fontWeight={500} fontSize={20} className="tex-gray-500 dark:text-white">
            Error
          </Text>
          <CloseIcon className="tex-gray-500 dark:text-white" onClick={onDismiss} />
        </RowBetween>
        <AutoColumn style={{ marginTop: 20, padding: '2rem 0' }} gap="24px" justify="center">
          <AlertTriangle color={theme.red1} style={{ strokeWidth: 1.5 }} size={64} />
          <Text fontWeight={500} fontSize={16} color={theme.red1} style={{ textAlign: 'center', width: '85%' }}>
            {message}
          </Text>
        </AutoColumn>
      </Section>
      <BottomSection gap="12px">
        <button
          type="button"
          onClick={onDismiss}
          className={`bg-indigo-600 hover:bg-indigo-700 cursor-pointer w-full inline-flex items-center justify-center text-center px-4 py-3 border border-transparent shadow-sm font-medium text-lg rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-5`}
        >
          Dismiss
        </button>
      </BottomSection>
    </Wrapper>
  )
}

interface ConfirmationModalProps {
  isOpen: boolean
  onDismiss: () => void
  hash: string | undefined
  content: () => React.ReactNode
  attemptingTxn: boolean
  pendingText: string
}

export default function TransactionConfirmationModal({
  isOpen,
  onDismiss,
  attemptingTxn,
  hash,
  pendingText,
  content,
}: ConfirmationModalProps) {
  const { chainId } = useActiveWeb3React()

  if (!chainId) return null

  // confirmation screen
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
      {attemptingTxn ? (
        <ConfirmationPendingContent onDismiss={onDismiss} pendingText={pendingText} />
      ) : hash ? (
        <TransactionSubmittedContent chainId={chainId} hash={hash} onDismiss={onDismiss} />
      ) : (
        content()
      )}
    </Modal>
  )
}
