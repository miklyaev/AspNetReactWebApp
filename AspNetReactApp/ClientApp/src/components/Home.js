import React, { Component } from 'react';

export class Home extends Component {
  static displayName = Home.name;

  render() {
    return (
      <div>
        <h1>Добро пожаловать в Asp.Net Core и React</h1>
        <p>Kestrel запущен на порту 5000 и готов к работе за Nginx.</p>
      </div>);
  }
}
