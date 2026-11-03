import { Switch } from '@heroui/react'
import { Icon } from '@/common/ui/icons'
import { useTheme } from '../theme'

export default function ThemeSwitch() {
  const [theme, setTheme] = useTheme()
  return (
    <Switch
      className="theme-switch"
      aria-label={`Use ${theme === 'dark' ? 'light' : 'dark'} theme`}
      isSelected={theme === 'dark'}
      onChange={(selected) => setTheme(selected ? 'dark' : 'light')}
      size="sm"
    >
      {({ isSelected }) => (
        <Switch.Content className="theme-switch-content">
          <span className="theme-switch-label">
            <Icon icon={isSelected ? 'lucide:moon' : 'lucide:sun'} width={14} />
            {isSelected ? 'Dark' : 'Light'}
          </span>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Content>
      )}
    </Switch>
  )
}
