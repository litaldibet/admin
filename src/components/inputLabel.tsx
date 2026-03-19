export default function InputLabel({value}: {value: string}) {
    return (
        <div
            style={{
                fontSize: '30px',
                fontWeight: 700,
                color: '#0f172a',
                lineHeight: 1,
            }}
        >
            {value}
        </div>
    )
}