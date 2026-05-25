import React from 'react';

export function GuestButton(props) {
  const disabled = props.disabled || window.__guestMode;
  const className = props.className || 'btn btn-primary';

  return (
    <button
      {...props}
      disabled={disabled}
      className={`${className}${disabled ? ' disabled' : ''}`}
      title={disabled ? 'В гостевом профиле редактирование запрещено! Войдите в свой профиль.' : props.title}
    />
  );
}
