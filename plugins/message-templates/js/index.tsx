import { Design } from '@revenge-mod/discord/design'

interface Template {
    name: string
    text: string
}

interface Settings {
    templates: Template[]
    speed: number
}

export default plugin<{ jsonStorage: Settings }>({
    jsonStorage: {
        load: true,
        default: {
            templates: [
                { name: 'Hello', text: 'Hey, how are you?' },
                { name: 'Thanks', text: 'Thanks for helping me!' },
            ],
            speed: 50,
        },
    },

    start({ logger }) {
        logger.log('Message Templates started')
    },

    SettingsComponent({ api }) {
        const { TableRowGroup, TableSliderRow } = Design
        const settings = api.jsonStorage.use()

        const templates = settings?.templates ?? []
        const speed = settings?.speed ?? 50

        return (
            <>
                <TableRowGroup title="Message Templates">
                    {templates.map((template, index) => (
                        <TableRowGroup key={index} title={template.name}>
                            <TableSliderRow
                                label="Preview speed"
                                value={speed}
                                minimumValue={1}
                                maximumValue={100}
                                onValueChange={(value: number) =>
                                    api.jsonStorage.set({
                                        templates,
                                        speed: Math.round(value),
                                    })
                                }
                            />
                        </TableRowGroup>
                    ))}
                </TableRowGroup>
            </>
        )
    },
})
