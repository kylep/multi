import styled from 'styled-components';

const HeaderContainer = styled.div`
  background-color: #f5f5f5;
  padding: 10px 20px;
  border-bottom: 2px solid #e1e1e1;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const IndexLink = styled.a`
  text-decoration: none;
  color: black;
  cursor: pointer;
`;

const Title = styled.h1`
  margin: 0;
`;

const PostHeader = ({ title }) => (
  <HeaderContainer>
    <IndexLink href="/">Index</IndexLink>
    <Title>{title}</Title>
  </HeaderContainer>
);

export default PostHeader;
