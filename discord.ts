import type { Deps } from './typeSend'

export interface SendArgs {
    message: string
    seconds: number
    channelId: string
}

type AnyFn = (...args: any[]) => any

function findByProps(...props: string[]): any {
    try {
        const metro = (globalThis as any)?.vendetta?.metro
            ?? (globalThis as any)?.Revenge?.metro
            ?? (globalThis as any)?.metro
        return metro?.findByProps?.(...props) ?? null
    } catch {
        return null
    }
}

export function getCurrentChannelId(): string | null {
    try {
        const store =
            findByProps('getLastSelectedChannelId') ??
            findByProps('getChannelId') ??
            findByProps('getCurrentChannelId')

        const id = store?.getLastSelectedChannelId?.()
            ?? store?.getCurrentChannelId?.()
            ?? store?.getChannelId?.()

        return typeof id === 'string' ? id : null
    } catch {
        return null
    }
}

function resolveSendAction(): AnyFn | null {
    const candidates = [
        findByProps('sendMessage'),
        findByProps('sendMessage', 'editMessage'),
        findByProps('sendMessage', 'deleteMessage'),
        findByProps('sendMessage', 'sendMessage')
    ]

    for (const mod of candidates) {
        if (typeof mod?.sendMessage === 'function') return mod.sendMessage.bind(mod)
    }

    return null
}

function resolveEditAction(): AnyFn | null {
    const candidates = [
        findByProps('editMessage'),
        findByProps('editMessage', 'deleteMessage'),
        findByProps('editMessage', 'sendMessage')
    ]

    for (const mod of candidates) {
        if (typeof mod?.editMessage === 'function') return mod.editMessage.bind(mod)
    }

    return null
}

function normalizeId(result: any): string | null {
    if (typeof result === 'string') return result
    return result?.id ?? result?.message?.id ?? result?.body?.id ?? null
}

export function getSendDeps(): Deps | null {
    const send = resolveSendAction()
    const edit = resolveEditAction()

    if (!send || !edit) return null

    return {
        sendMessage: async (channelId, content) => {
            const result = await send(channelId, { content })
            const id = normalizeId(result)
            if (!id) throw new Error('Discord sendMessage did not return a message id')
            return { id }
        },

        editMessage: async (channelId, messageId, content) => {
            await edit(channelId, messageId, { content })
        },
    }
}

export function registerSendCommand(
    handler: (args: SendArgs) => Promise<void>,
): boolean {
    try {
        const api =
            findByProps('registerCommand') ??
            (globalThis as any)?.vendetta?.commands ??
            (globalThis as any)?.Revenge?.commands

        if (typeof api?.registerCommand !== 'function') return false

        api.registerCommand({
            name: 'send',
            description: 'Send a message progressively over time',
            options: [
                {
                    name: 'message',
                    description: 'Message to send',
                    type: 3,
                    required: true,
                },
                {
                    name: 'seconds',
                    description: 'How many seconds to take',
                    type: 10,
                    required: true,
                },
            ],
            execute: async (args: any) => {
                const message =
                    args?.message ??
                    args?.options?.find?.((x: any) => x?.name === 'message')?.value

                const secondsRaw =
                    args?.seconds ??
                    args?.options?.find?.((x: any) => x?.name === 'seconds')?.value

                const channelId =
                    args?.channelId ??
                    args?.channel?.id ??
                    getCurrentChannelId()

                if (typeof message !== 'string' || !channelId) return

                await handler({
                    message,
                    seconds: Number(secondsRaw),
                    channelId,
                })
            },
        })

        return true
    } catch {
        return false
    }
}
