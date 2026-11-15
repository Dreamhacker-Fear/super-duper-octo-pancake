import { useEffect, useState } from 'react'
import { Design } from '@revenge-mod/discord/design'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'

interface Template {
    name: string
    text: string
}

interface Settings {
    templates: Template[]
    speed: number
}

function speedToDelay(speed: number) {
    return Math.max(8, 180 - speed * 1.7)
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

        const [name, setName] = useState('')
        const [text, setText] = useState('')
        const [preview, setPreview] = useState('')
        const [selected, setSelected] = useState<number | null>(null)

        const templates = settings?.templates ?? []
        const speed = settings?.speed ?? 50

        useEffect(() => {
            if (selected === null || !templates[selected]) {
                setPreview('')
                return
            }

            const source = templates[selected].text
            let index = 0
            setPreview('')

            const timer = setInterval(() => {
                index += 1
                setPreview(source.slice(0, index))

                if (index >= source.length) {
                    clearInterval(timer)
                }
            }, speedToDelay(speed))

            return () => clearInterval(timer)
        }, [selected, speed, templates])

        const saveSettings = (nextTemplates: Template[], nextSpeed = speed) => {
            api.jsonStorage.set({
                templates: nextTemplates,
                speed: nextSpeed,
            })
        }

        const addTemplate = () => {
            const cleanName = name.trim()
            const cleanText = text.trim()

            if (!cleanName || !cleanText) return

            saveSettings([...templates, { name: cleanName, text: cleanText }])
            setName('')
            setText('')
        }

        const removeTemplate = (index: number) => {
            const next = templates.filter((_, i) => i !== index)
            saveSettings(next)

            if (selected === index) {
                setSelected(null)
            } else if (selected !== null && selected > index) {
                setSelected(selected - 1)
            }
        }

        return (
            <ScrollView>
                <TableRowGroup title="Typing Speed">
                    <TableSliderRow
                        label={`Speed: ${speed}`}
                        value={speed}
                        minimumValue={1}
                        maximumValue={100}
                        onValueChange={(value: number) =>
                            saveSettings(templates, Math.round(value))
                        }
                    />
                </TableRowGroup>

                <TableRowGroup title="Add Template">
                    <View style={{ padding: 16, gap: 10 }}>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="Template name"
                            placeholderTextColor="#8f8f96"
                            style={{
                                padding: 12,
                                borderRadius: 8,
                                backgroundColor: '#202126',
                                color: '#fff',
                            }}
                        />

                        <TextInput
                            value={text}
                            onChangeText={setText}
                            placeholder="Message text"
                            placeholderTextColor="#8f8f96"
                            multiline
                            style={{
                                minHeight: 90,
                                padding: 12,
                                borderRadius: 8,
                                backgroundColor: '#202126',
                                color: '#fff',
                                textAlignVertical: 'top',
                            }}
                        />

                        <Pressable
                            onPress={addTemplate}
                            style={{
                                padding: 12,
                                borderRadius: 8,
                                backgroundColor: '#5865F2',
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{ color: '#fff', fontWeight: '700' }}>
                                Add Template
                            </Text>
                        </Pressable>
                    </View>
                </TableRowGroup>

                <TableRowGroup title="Templates">
                    <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                        {templates.length === 0 ? (
                            <Text style={{ color: '#999', paddingVertical: 12 }}>
                                No templates yet.
                            </Text>
                        ) : (
                            templates.map((template, index) => (
                                <View
                                    key={`${template.name}-${index}`}
                                    style={{
                                        padding: 12,
                                        marginTop: 10,
                                        borderRadius: 10,
                                        backgroundColor: '#202126',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#fff',
                                            fontSize: 16,
                                            fontWeight: '700',
                                        }}
                                    >
                                        {template.name}
                                    </Text>

                                    <Text
                                        style={{
                                            color: '#aaa',
                                            marginTop: 5,
                                        }}
                                    >
                                        {template.text}
                                    </Text>

                                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                                        <Pressable
                                            onPress={() => setSelected(index)}
                                            style={{
                                                flex: 1,
                                                padding: 10,
                                                borderRadius: 7,
                                                backgroundColor: '#5865F2',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '700' }}>
                                                Use Template
                                            </Text>
                                        </Pressable>

                                        <Pressable
                                            onPress={() => removeTemplate(index)}
                                            style={{
                                                padding: 10,
                                                borderRadius: 7,
                                                backgroundColor: '#34353b',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Text style={{ color: '#ff8f8f', fontWeight: '700' }}>
                                                Delete
                                            </Text>
                                        </Pressable>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </TableRowGroup>

                {selected !== null && templates[selected] && (
                    <TableRowGroup title="Typing Preview">
                        <View style={{ padding: 16 }}>
                            <Text
                                style={{
                                    color: '#fff',
                                    minHeight: 70,
                                    padding: 12,
                                    borderRadius: 8,
                                    backgroundColor: '#202126',
                                }}
                            >
                                {preview}
                            </Text>

                            <Text style={{ color: '#888', marginTop: 8 }}>
                                Preview only — it does not send the message.
                            </Text>
                        </View>
                    </TableRowGroup>
                )}
            </ScrollView>
        )
    },
})
